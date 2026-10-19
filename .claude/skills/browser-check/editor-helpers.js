// Adds `window.editor`, helpers for checking the chord editor by hand.
// Load it once per browser with `playwright-cli run-code --filename=<this file>`;
// it stays across reloads and navigation.
// The checks match the ones in apps/web/e2e/sheet-editor.spec.ts.
async (page) => {
  const install = () => {
    // The letters of each line as [text node, offset] pairs, in order.
    function lineChars(line) {
      const chars = [];
      const walker = document.createTreeWalker(line, NodeFilter.SHOW_TEXT);
      for (let node = walker.nextNode(); node; node = walker.nextNode()) {
        for (let i = 0; i < node.length; i++) chars.push([node, i]);
      }
      return chars;
    }

    // The letter at `offset` in the first match of `needle`.
    function find(needle, offset = 0) {
      for (const line of document.querySelectorAll(".ProseMirror .line")) {
        const chars = lineChars(line);
        const found = chars.map(([node, i]) => node.data[i]).join("").indexOf(needle);
        if (found < 0) continue;
        const char = chars[found + offset];
        if (char) return char;
      }
      throw new Error(`"${needle}" not found`);
    }

    // A line as text, with chords in brackets before their letter.
    function lineText(line) {
      let result = "";
      for (const [node, i] of lineChars(line)) {
        const chorded = node.parentElement.closest(".chorded");
        if (chorded && i === 0) {
          for (const { chord } of JSON.parse(chorded.dataset.chords)) result += `[${chord}]`;
        }
        result += node.data[i];
      }
      return result;
    }

    window.editor = {
      // The sheet as shown, one entry per section. The active one is marked.
      sheet() {
        return [...document.querySelectorAll(".ProseMirror .section")].map((section) => ({
          active: section.classList.contains("is-active"),
          lines: [...section.querySelectorAll(".line")].map(lineText),
        }));
      },

      // Puts the caret before the letter, without a click.
      caret(needle, offset = 0) {
        const [node, i] = find(needle, offset);
        document.querySelector(".ProseMirror").focus();
        document.getSelection().collapse(node, i);
      },

      // Selects the first match of `needle`.
      select(needle) {
        const [startNode, start] = find(needle, 0);
        const [endNode, end] = find(needle, needle.length - 1);
        document.querySelector(".ProseMirror").focus();
        document.getSelection().setBaseAndExtent(startNode, start, endNode, end + 1);
      },

      // Viewport coordinates of the letter, for `mousemove` and a click.
      charBox(needle, offset = 0) {
        const [node, i] = find(needle, offset);
        const range = document.createRange();
        range.setStart(node, i);
        range.setEnd(node, i + 1);
        const box = range.getBoundingClientRect();
        return { left: box.left, right: box.right, y: box.top + box.height / 2 };
      },

      // Pastes plain text at the caret, as the browser does.
      paste(text) {
        const data = new DataTransfer();
        data.setData("text/plain", text);
        document.querySelector(".ProseMirror").dispatchEvent(
          new ClipboardEvent("paste", { clipboardData: data, bubbles: true, cancelable: true }),
        );
      },

      // Chord labels that are missing or not above their letter.
      misplacedChords() {
        const problems = [];
        for (const letter of document.querySelectorAll(".ProseMirror span.chorded")) {
          const [id] = (letter.dataset.chordIds ?? "").split(" ");
          const label = document.querySelector(`[data-chord-id="${id ?? ""}"]`);
          if (!label) {
            problems.push(`no label over "${letter.textContent}"`);
            continue;
          }
          const box = letter.getBoundingClientRect();
          const labelBox = label.getBoundingClientRect();
          if (Math.abs(labelBox.left - box.left) > 1 || labelBox.bottom > box.top + 4) {
            problems.push(`${label.textContent} over "${letter.textContent}"`);
          }
        }
        return problems;
      },

      // Chord labels in the same row that overlap.
      overlappingChords() {
        const boxes = [...document.querySelectorAll(".chord-layer .chord-label")].map(
          (label) => ({ name: label.textContent, box: label.getBoundingClientRect() }),
        );
        const problems = [];
        for (const [i, a] of boxes.entries()) {
          for (const b of boxes.slice(i + 1)) {
            const sameRow = Math.abs(a.box.top - b.box.top) < 2;
            if (sameRow && a.box.right > b.box.left && b.box.right > a.box.left) {
              problems.push(`${a.name} and ${b.name}`);
            }
          }
        }
        return problems;
      },
    };
  };
  await page.addInitScript(install);
  await page.evaluate(install);
  return "window.editor is ready";
}
