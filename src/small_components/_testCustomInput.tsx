import { useEffect, useRef } from 'react';
import './CustomInput.css'

type Params = {
  value: string,
  onChange: (text: string) => void,
  id?: string
}

const CustomInput = ({ value, onChange, id }: Params) => {
  const editableDivRef = useRef<HTMLDivElement>(null);
  const caretPositionRef = useRef<Range | null>(null); // To store the caret position

  const handleInputChange = () => {
    const content = editableDivRef.current?.innerText || '';
    onChange(content)
  };


  useEffect(() => {
    // Restore the caret position after every re-render
    if (caretPositionRef.current !== null) {
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(caretPositionRef.current);
    }
  });

  const handleSelectionChange = () => {
    // Store the current caret position when the selection changes
    const selection = window.getSelection();
    if (selection?.rangeCount && selection?.getRangeAt(0)) {
      caretPositionRef.current = selection?.getRangeAt(0);
    }
  };

  return (
    <div
      id={id}
      ref={editableDivRef}
      className='custom-input'
      contentEditable
      onInput={handleInputChange}
      onBlur={handleInputChange}
      onSelect={handleSelectionChange}
    >{value}</div>
  )
}

export default CustomInput