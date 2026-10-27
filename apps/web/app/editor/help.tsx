import "./help.css";

// How to edit, for the side panel. It holds the help for touch, the keys and
// the help for a mouse, in that order, and CSS hides the group that doesn't
// match the main pointer. So a finger gets touch, then keys, and a mouse gets
// keys, then mouse, already from the server. The text follows
// docs/ui-text.md.
export function EditorHelp() {
  return (
    <>
      <p className="help-intro">
        <span className="help-touch">Tap a section to edit it</span>
        <span className="help-mouse">Click a section to edit it</span>
      </p>
      <div className="help-group help-touch">
        <h3>With touch</h3>
        <ul>
          <li>
            Tap <strong>Chord</strong> in the toolbar to add a chord at the
            cursor
          </li>
          <li>Tap a chord to edit it, drag it to move it</li>
          <li>
            Use <strong>Move</strong> in the toolbar to move the section
          </li>
        </ul>
      </div>
      <div className="help-group help-keys">
        <h3 className="help-touch">With a keyboard</h3>
        <dl>
          <dt>
            <kbd>Ctrl K</kbd> or <kbd>⌘ K</kbd>
          </dt>
          <dd>Add a chord at the cursor, or edit it</dd>
          <dt>
            <kbd>Enter</kbd> <kbd>Enter</kbd>
          </dt>
          <dd>Start a new section</dd>
          <dt>
            <kbd>Backspace</kbd>
          </dt>
          <dd>At a section's start, join it with the one above</dd>
          <dt>
            <kbd>Esc</kbd>
          </dt>
          <dd>Stop editing</dd>
        </dl>
      </div>
      <div className="help-group help-mouse">
        <h3>With a mouse</h3>
        <ul>
          <li>Click below a letter to add a chord there</li>
          <li>Click a chord to edit it, drag it to move it</li>
        </ul>
      </div>
    </>
  );
}
