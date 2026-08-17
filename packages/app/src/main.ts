import './style.css';

const app = document.querySelector<HTMLDivElement>('#app')!;

app.innerHTML = `
  <main class="shell">
    <h1>MdTask</h1>
    <p class="tagline">Markdown-first task management · Tasks-plugin compatible · No lock-in</p>

    <section class="card">
      <h2>Project skeleton (v0.1)</h2>
      <ul>
        <li><code>@md-task/core</code> — markdown task parsing engine (pure TS, zero deps)</li>
        <li><code>@md-task/app</code> — this GUI shell (Vite + TypeScript)</li>
      </ul>
      <p class="status">Roadmap: tree-editor interactions, folder watching, sync-friendly editing, Tauri desktop wrapper.</p>
    </section>

    <section class="card">
      <h2>Try the parser</h2>
      <textarea id="md-input" rows="8" placeholder="Paste some markdown checklist here...">- [ ] design the task model
- [x] scaffold the monorepo
  - [ ] subtask example
- [ ] integrate with @md-task/core</textarea>
      <button id="parse-btn">Parse tasks</button>
      <pre id="result"></pre>
    </section>
  </main>
`;

const input = document.querySelector<HTMLTextAreaElement>('#md-input')!;
const result = document.querySelector<HTMLPreElement>('#result')!;

document.querySelector('#parse-btn')!.addEventListener('click', async () => {
  const { parseDocument } = await import('@md-task/core');
  const d = parseDocument(input.value);
  result.textContent = JSON.stringify(d.tasks, null, 2);
});
