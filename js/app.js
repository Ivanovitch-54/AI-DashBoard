const API_KEY = window.APP_CONFIG?.OPENROUTER_API_KEY?.trim() || "";

const toolButtons = document.querySelectorAll(".tool-btn");
const promptInput = document.querySelector("#promptInput");
const generateBtn = document.querySelector("#generateBtn");
const clearHistoryBtn = document.querySelector("#clearHistoryBtn");
const chatContainer = document.querySelector("#chatContainer");

let currentTool = "chat";
let currentConversationId = null;

// New chat

const newChatBtn = document.querySelector("#newChatBtn");

newChatBtn.addEventListener("click", () => {
  currentConversationId = null;

  chatContainer.innerHTML = "";
});

// Clean History Btn

clearHistoryBtn.addEventListener("click", () => {
  const confirmDelete = confirm("Clear all conversations?");

  if (!confirmDelete) return;

  localStorage.removeItem("conversations");

  renderConversations();
});

// Changement de Tool //

toolButtons.forEach((button) => {
  button.addEventListener("click", () => {
    toolButtons.forEach((btn) => btn.classList.remove("active"));

    button.classList.add("active");

    currentTool = button.dataset.tool;
  });
});

// Create Conversation

function createConversation(prompt) {
  let conversations = JSON.parse(localStorage.getItem("conversations")) || [];

  const newConversation = {
    id: Date.now(),

    title: prompt.slice(0, 40),

    messages: [],
  };

  conversations.unshift(newConversation);

  localStorage.setItem("conversations", JSON.stringify(conversations));

  currentConversationId = newConversation.id;

  renderConversations();
}

// Generate Button //

generateBtn.addEventListener("click", async () => {
  const text = promptInput.value.trim();

  if (!text) return;

  promptInput.value = "";

  addMessage(text, "user");

  const typing = document.createElement("div");
  typing.classList.add("typing");
  typing.innerText = "AI is typing...";

  chatContainer.appendChild(typing);

  const aiMessageContent = document.createElement("div");
  aiMessageContent.classList.add("content");

  const aiMessage = document.createElement("div");
  aiMessage.classList.add("message", "ai");

  const avatar = document.createElement("div");
  avatar.classList.add("avatar");
  avatar.innerText = "AI";

  aiMessage.appendChild(avatar);
  aiMessage.appendChild(aiMessageContent);

  chatContainer.appendChild(aiMessage);

  generateBtn.disabled = true;

  if (!currentConversationId) {
    createConversation(text);
  }

  try {
    if (!API_KEY) {
      throw new Error(
        "Missing API key. Create js/config.local.js from js/config.example.js.",
      );
    }

    const finalPrompt = buildPrompt(text);

    await callAI(finalPrompt, (token) => {
      typing.remove();

      aiMessageContent.innerText += token;

      chatContainer.scrollTop = chatContainer.scrollHeight;
    });

    saveMessage("user", text);
    saveMessage("ai", aiMessageContent.innerText);
  } catch (error) {
    typing.remove();

    aiMessageContent.innerText = error.message || "Error contacting AI";
  }

  generateBtn.disabled = false;

  promptInput.focus();
});

// Call IA //

async function callAI(prompt, onToken) {
  const response = await fetch(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + API_KEY,
      },
      body: JSON.stringify({
        model: "openai/gpt-4o-mini",
        stream: true,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
      }),
    },
  );

  if (!response.ok) {
    throw new Error("OpenRouter request failed.");
  }

  if (!response.body) {
    throw new Error("No response body received from OpenRouter.");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder("utf-8");

  let done = false;

  while (!done) {
    const { value, done: doneReading } = await reader.read();
    done = doneReading;

    const chunk = decoder.decode(value);

    const lines = chunk.split("\n");

    for (let line of lines) {
      if (line.startsWith("data: ")) {
        const data = line.replace("data: ", "");

        if (data === "[DONE]") return;

        try {
          const json = JSON.parse(data);

          const token = json.choices?.[0]?.delta?.content;

          if (token) {
            onToken(token);
          }
        } catch (e) {}
      }
    }
  }
}

// Select IA Tool

function buildPrompt(userText) {
  if (currentTool === "chat") {
    return userText;
  }

  if (currentTool === "summary") {
    return "Summarize this text:\n\n" + userText;
  }

  if (currentTool === "code") {
    return "Explain this code clearly:\n\n" + userText;
  }

  if (currentTool === "ideas") {
    return "Generate 5 startup ideas about:\n\n" + userText;
  }
}

// Save Prompt history

function saveHistory(prompt, response) {
  let history = JSON.parse(localStorage.getItem("aiHistory")) || [];

  history.unshift({
    prompt: prompt,
    response: response,
  });

  localStorage.setItem("aiHistory", JSON.stringify(history));

  renderHistory();
}

// Show Prompt history

function renderHistory() {
  const historyList = document.querySelector("#historyList");

  let history = JSON.parse(localStorage.getItem("aiHistory")) || [];

  historyList.innerHTML = "";

  history.slice(0, 10).forEach((item) => {
    const li = document.createElement("li");

    li.textContent = item.prompt;

    li.addEventListener("click", () => {
      addMessage(item.prompt, "user");
      addMessage(item.response, "ai");
    });

    historyList.appendChild(li);
  });
}

// Function to add message

function addMessage(text, role) {
  const message = document.createElement("div");
  message.classList.add("message");

  const avatar = document.createElement("div");
  avatar.classList.add("avatar");

  const content = document.createElement("div");
  content.classList.add("content");

  content.innerHTML = marked.parse(text);

  if (role === "user") {
    avatar.innerText = "U";
    message.classList.add("user");
  }

  if (role === "ai") {
    avatar.innerText = "AI";

    const copyBtn = document.createElement("button");
    copyBtn.innerText = "Copy";
    copyBtn.classList.add("copy-btn");

    copyBtn.addEventListener("click", () => {
      navigator.clipboard.writeText(content.innerText);

      copyBtn.innerText = "Copied!";
      setTimeout(() => {
        copyBtn.innerText = "Copy";
      }, 1500);
    });

    content.appendChild(copyBtn);
  }

  message.appendChild(avatar);
  message.appendChild(content);

  chatContainer.appendChild(message);

  chatContainer.lastElementChild?.scrollIntoView({
    behavior: "smooth",
  });
}

// Save Chat

function saveMessage(role, text) {
  let conversations = JSON.parse(localStorage.getItem("conversations")) || [];

  const conversation = conversations.find(
    (c) => c.id === currentConversationId,
  );

  if (!conversation) return;

  conversation.messages.push({
    role: role,
    text: text,
  });

  localStorage.setItem("conversations", JSON.stringify(conversations));
}

// Load Chat

function renderConversations() {
  const historyList = document.querySelector("#historyList");

  let conversations = JSON.parse(localStorage.getItem("conversations")) || [];

  historyList.innerHTML = "";

  conversations.slice(0, 10).forEach((conv) => {
    const li = document.createElement("li");

    li.textContent = conv.title;

    li.addEventListener("click", () => {
      currentConversationId = conv.id;

      chatContainer.innerHTML = "";

      conv.messages.forEach((msg) => {
        addMessage(msg.text, msg.role);
      });
    });

    historyList.appendChild(li);
  });
}

// Better generate button UX

promptInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    generateBtn.click();
  }
});

// Load prompt history when start

renderConversations();
