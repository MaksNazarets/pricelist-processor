import { ChangeEvent, useEffect, useRef, useState } from "react";

type Params = {
    value: string,
    letters: string[]
    // onChange: (event: ChangeEvent<HTMLInputElement>) => void,
    onChange: (text: string) => void,
    id?: string,
    placeholder?: string
}

const CustomTextInput = ({ value, letters: letters, onChange, id, placeholder }: Params) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const [caretPositionIndex, setCaretPositionIndex] = useState(0)

    useEffect(() => {
        inputRef.current?.setSelectionRange(caretPositionIndex, caretPositionIndex);
    }, [caretPositionIndex])

    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const { value: inputValue, selectionStart } = event.target;
        const beforeCaret = inputValue.slice(0, selectionStart || 0);
        const afterCaret = inputValue.slice(selectionStart || 0);
        const countTagsBeforeCaret = (beforeCaret.match(/⌯/g) || []).length;
        const countTagsAfterCaret = (afterCaret.match(/⌯/g) || []).length;
        console.log('count:', countTagsAfterCaret)
        if (countTagsBeforeCaret % 2 === 1) {
            const tagStartIndex = beforeCaret.slice(0, beforeCaret.length - 1).lastIndexOf("⌯")

            const newValue = value.slice(0, tagStartIndex) + value.slice(beforeCaret.length + 1)
            onChange(newValue);
            setCaretPositionIndex(tagStartIndex);
        }
        else if (countTagsAfterCaret % 2 === 1) {
            const tagEndIndex = (selectionStart || 0) + inputValue.slice(selectionStart || 0).indexOf("⌯")

            const newValue = inputValue.slice(0, selectionStart || 0) + inputValue.slice(tagEndIndex + 1)

            console.log(value.slice(0, selectionStart || 0), '=', value.slice(tagEndIndex + 1))
            onChange(newValue);
            setCaretPositionIndex(selectionStart || 0);
        }
        else {
            onChange(inputValue);
        }
    };

    const handleInputSelect = () => {
        const { value: inputValue, selectionStart } = inputRef.current!;
        const beforeCaret = inputValue.slice(0, selectionStart || 0);
        const countHashTags = (beforeCaret.match(/⌯/g) || []).length;

        // console.log(beforeCaret.slice(0, beforeCaret.length).lastIndexOf("⌯"),
        //     selectionStart || 0 + inputValue.slice(selectionStart || 0).indexOf("⌯") + 1)

        if (countHashTags % 2 === 1) {
            inputRef.current?.setSelectionRange(
                beforeCaret.slice(0, beforeCaret.length).lastIndexOf("⌯"),
                beforeCaret.length + inputValue.slice(selectionStart || 0).indexOf("⌯") + 1
            )
        }
    }

    const insertLetterIntoInput = (letters: string) => {
        if (inputRef.current) {
            const { selectionStart, selectionEnd } = inputRef.current;
            const newValue =
                value.substring(0, selectionStart || 0) +
                letters +
                value.substring(selectionEnd || 0);


            // Move the caret position after the inserted text
            const newCaretPosition = (selectionStart || 0) + letters.length;

            onChange(newValue);

            inputRef.current.focus()
            setCaretPositionIndex(newCaretPosition);
        }
    }

    return (
        <div className="formula-input-wrapper" >
            <input
                ref={inputRef}
                type="text"
                id={id}
                value={value}
                placeholder={placeholder}
                onChange={handleInputChange}
                onSelect={handleInputSelect}
            />
            <div className="input-col-letter-container">
                {letters.map(letter =>
                    <span
                        className="input-col-letter"
                        onClick={() => insertLetterIntoInput(`⌯${letter}⌯`)}
                        key={letter}
                    >{letter}</span>)}
            </div>
        </div>
    );
};

export default CustomTextInput;
