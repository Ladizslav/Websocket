let isUpdating = false;

function saveCaretPosition(editableDiv) {
    const selection = window.getSelection();
    const range = selection.getRangeAt(0);
    const preCaretRange = range.cloneRange();
    preCaretRange.selectNodeContents(editableDiv);
    preCaretRange.setEnd(range.endContainer, range.endOffset);
    return preCaretRange.toString().length; 
}

function restoreCaretPosition(editableDiv, position) {
    const selection = window.getSelection();
    const range = document.createRange();
    let currentPos = 0;

    function traverseNodes(node) {
        if (node.nodeType === Node.TEXT_NODE) {
            const textLength = node.textContent.length;
            if (currentPos + textLength >= position) {
                range.setStart(node, position - currentPos);
                range.collapse(true);
                return true;
            }
            currentPos += textLength;
        } else {
            for (let i = 0; i < node.childNodes.length; i++) {
                if (traverseNodes(node.childNodes[i])) {
                    return true;
                }
            }
        }
        return false;
    }

    traverseNodes(editableDiv);
    selection.removeAllRanges();
    selection.addRange(range);
}

socket.on('document', (content) => {
    if (!isUpdating) {
        const caretPosition = saveCaretPosition(editor); 
        editor.innerText = content; 
        restoreCaretPosition(editor, caretPosition); 
    }
});

editor.addEventListener('input', () => {
    isUpdating = true; 
    const content = editor.innerText;
    socket.emit('edit', { content });

    setTimeout(() => {
        isUpdating = false;
    }, 5000);
});
