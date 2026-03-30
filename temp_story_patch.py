from pathlib import Path
path = Path('src/components/components.css')
text = path.read_text()
old = """/* Story Viewer Overlay */
.story-viewer-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.95);
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.story-viewer-content {
  position: relative;
  width: 100%;
  max-width: 450px;
  height: 100%;
  max-height: 850px;
  display: flex;
  flex-direction: column;
}

.story-progress-container {
"""
new = """/* Story Viewer Overlay */
.story-viewer-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.95);
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.story-viewer-content {
  position: relative;
  width: 100%;
  height: 100%;
  max-width: 100%;
  max-height: 100%;
  display: flex;
  flex-direction: column;
}

.story-nav-zone {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 30%;
  background: transparent;
  border: none;
  cursor: pointer;
  z-index: 20;
}

.story-nav-zone:focus-visible {
  outline: 2px solid rgba(255,255,255,0.6);
}

.prev-zone {
  left: 0;
}

.next-zone {
  right: 0;
}

.story-progress-container {
"""
if old not in text:
    print('old snippet not found, no changes.')
else:
    text = text.replace(old, new)
    path.write_text(text)
    print('replaced snippets, occurrences:', text.count(old))
