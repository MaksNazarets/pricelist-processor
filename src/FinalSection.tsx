import { ChangeEvent, useContext, useEffect, useState } from "react";
import { MainContext } from "./App";
import { DragDropContext, Droppable, Draggable, DropResult } from "react-beautiful-dnd";
import axios from "axios";
import { serverUrl } from "./constants";
import WaitingCircle from "./small_components/WaitingCircle";
import CustomTextInput from "./small_components/CustomTextInput";
import { DraggableItem } from "./small_components/DraggableItem";

export const fillingMethods: { [key: string]: string } = {
  leaveEmpty: 'Залишити порожнім',
  formula: 'Власна структура',
  // sum: 'Сума значень з інших стовпчиків (працює для числових даних)',
  staticValue: 'Статичне значення'
};


export const getColumnLetters = (columnNumber: number) => {
  let columnLetter = '';
  let tempNumber;

  while (columnNumber > 0) {
    tempNumber = (columnNumber - 1) % 26;
    columnLetter = String.fromCharCode(tempNumber + 65) + columnLetter;
    columnNumber = Math.floor((columnNumber - tempNumber) / 26);
  }

  return columnLetter;
}

const getChangedLettersDictionary = (initialArray: string[], changedArray: string[]) => {
  let result: { [key: string]: string } = {};

  for (let i = 0; i < initialArray.length; i++) {
    const initialElement = initialArray[i];
    const changedIndex = changedArray.indexOf(initialElement);
    result[getColumnLetters(i + 1)] = getColumnLetters(changedIndex + 1) || ' '.repeat(getColumnLetters(i + 1).length);
  }

  return result;
}

const FinalSection = () => {
  const { fileUploaded, fileInputRef } = useContext(MainContext)
  const [newColumnFillingMethod, setNewColumnFillingMethod] = useState<string | null>(null)
  const [newColFillingMethodParams, setNewColFillingMethodParams] = useState<{ [key: string]: any } | null>(null)

  const [newColumnName, setNewColumnName] = useState('')
  const [newColumns, setNewColumns] = useState<any[]>([])
  const [itemList, setItemList] = useState<string[]>(() => {
    let list = Object.values(fileUploaded.columnsRenamed).filter(val => val !== false).map((col) => String(col))

    if (fileUploaded.categoryColumnName)
      list = list.concat([fileUploaded.categoryColumnName])

    list = list.concat(newColumns)

    return list
  })

  const [downloadFilename, setDownloadFilename] = useState<string>('')
  const [isWaitingForResponse, setIsWaitingForResponse] = useState(false)

  useEffect(() => {
    setDownloadFilename('')
  }, [fileUploaded, newColumns, itemList])


  const handleDrop = (droppedItem: DropResult) => {
    // Ignore drop outside droppable container
    if (!droppedItem.destination) return;
    let updatedList = [...itemList];
    // Remove dragged item
    const [reorderedItem] = updatedList.splice(droppedItem.source.index, 1);
    // Add dropped item
    updatedList.splice(droppedItem.destination.index, 0, reorderedItem);
    // Update State
    setItemList(updatedList);

    let lettersChanged = getChangedLettersDictionary(itemList, updatedList) || {};
    console.log('lettersChanged:', lettersChanged)

    newColumns.forEach(col => {
      if (col.fillingMethod.name === 'formula') {
        let colScopeOpened = false;
        let currentColLetters = '';
        let currentColLetterStartIndex = 0;
        let newFormulaText: Array<string> = [...col.fillingMethod.formulaText];

        [...col.fillingMethod.formulaText].forEach((char, index) => {

          if (char === '⌯') {
            if (!colScopeOpened) currentColLetterStartIndex = index + 1
            else {
              if (lettersChanged[currentColLetters])
                newFormulaText.splice(currentColLetterStartIndex, currentColLetters.length, ...(lettersChanged[currentColLetters]))

              currentColLetters = ''
            }

            colScopeOpened = !colScopeOpened;
          }
          else if (colScopeOpened) {
            currentColLetters += char
          }
        })

        let newColsList = [...newColumns];

        newColsList.forEach((column, index) => {
          if (column.name === col.name) {
            newColsList[index].fillingMethod.formulaText = newFormulaText.join('')
          }
        })

        setNewColumns(newColsList)
      }
    });
  };

  const removeItem = (colName: string) => { // finish the function

    const newList = itemList.filter(col => col !== colName)

    setItemList(newList)

    let lettersChanged = getChangedLettersDictionary(itemList, newList) || {};
    console.log('lettersChanged:', lettersChanged)

    newColumns.forEach(col => {
      if (col.fillingMethod.name === 'formula') {
        let colScopeOpened = false;
        let currentColLetters = '';
        let currentColLetterStartIndex = 0;
        let newFormulaText: Array<string> = [...col.fillingMethod.formulaText];

        [...col.fillingMethod.formulaText].forEach((char, index) => {

          if (char === '⌯') {
            if (!colScopeOpened) currentColLetterStartIndex = index + 1
            else {
              newFormulaText.splice(currentColLetterStartIndex, currentColLetters.length, ...(lettersChanged[currentColLetters]))

              if (!lettersChanged[currentColLetters].trim()) {
                newFormulaText.splice(currentColLetterStartIndex - 1, 1, ' ')
                newFormulaText.splice(currentColLetterStartIndex + lettersChanged[currentColLetters].length, 1, ' ')
              }

              currentColLetters = ''
            }

            colScopeOpened = !colScopeOpened;
          }
          else if (colScopeOpened) {
            currentColLetters += char
          }
        })

        let newColsList = [...newColumns];

        let normalizedNewFormulaText = newFormulaText.join('').replace(/\s+/g, ' ').trim()
        
        newColsList.forEach((column, index) => {
          if (column.name === col.name) {
            newColsList[index].fillingMethod.formulaText = normalizedNewFormulaText
          }
        })

        setNewColumns(newColsList)
      }
    });

    setNewColumns(current => {
      return current.filter(col => col.name !== colName)
    })
  }

  const handleFillingMethodChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setNewColumnFillingMethod(e.target.value);
  }

  const confirmNewColumn = () => {
    let fm: { [key: string]: any } = {
      name: newColumnFillingMethod
    }

    if (newColumnFillingMethod === 'staticValue') {
      fm.value = newColFillingMethodParams?.staticValue || ''
    }
    else if (newColumnFillingMethod === 'formula') {
      fm.formulaText = newColFillingMethodParams?.formulaText;
      fm.unique = newColFillingMethodParams?.unique || false;
    }

    const newCol = {
      name: newColumnName,
      fillingMethod: fm
    }

    setNewColumns(current => {

      return [...current, newCol]
    })

    setItemList(current => {
      // console.log([...current, newColumnName])
      return [...current, newColumnName]
    })
    setNewColumnName('')
    setNewColumnFillingMethod(null)
    setNewColFillingMethodParams(null)
  }

  const sendData = () => {
    const formData = new FormData();
    formData.append('file', fileInputRef.current.files[0]);
    formData.append('selectedSheetName', fileUploaded.selectedSheetName);
    formData.append('tableStartCell', fileUploaded.tableStartCell);
    formData.append('columnsRenamed', JSON.stringify(fileUploaded.columnsRenamed));
    formData.append('hasCategoryRows', fileUploaded.hasCategoryRows);
    formData.append('categoryColumnName', fileUploaded.categoryColumnName);
    formData.append('itemList', JSON.stringify(itemList));
    formData.append('newColumns', JSON.stringify(newColumns));

    setIsWaitingForResponse(true)
    axios.post(serverUrl + '/format-pricelist', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    }).then((response) => {
      console.log(response.data);
      setDownloadFilename(response.data.filename)
      setIsWaitingForResponse(false)
    }).catch((error) => {
      console.log(error)
      setIsWaitingForResponse(false)
      alert('При обробці документу сталась помилка')
    })
  }

  return (
    <section id="final-section">
      <h2 className="section-heading">Впорядкуйте вибрані стовпчики та додайте нові за потреби:</h2>
      <DragDropContext onDragEnd={handleDrop}>
        <Droppable droppableId="droppable-area">
          {(provided) => (
            <div
              className="droppable-area"
              {...provided.droppableProps}
              ref={provided.innerRef}>

              {itemList.map((colName, index) =>
                <Draggable key={colName} draggableId={colName} index={index}>
                  {(provided) => (
                    <DraggableItem
                      provided={provided}
                      colName={colName}
                      isNewColumn={newColumns.map(col => col.name).includes(colName)}
                      fillingMethod={newColumns.find(col => col.name === colName)?.fillingMethod}
                      letter={getColumnLetters(index + 1)}
                      onRemoveButtonClick={() => removeItem(colName)}
                    />
                  )}
                </Draggable>
              )}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
      {
        !newColumnFillingMethod &&
        <button
          className="new-item-btn"
          onClick={() => setNewColumnFillingMethod(Object.keys(fillingMethods)[0])}
        >
          Додати
        </button>}
      {
        newColumnFillingMethod &&
        <>
          <h2 className="section-heading">Додавання нового стовпчика</h2>
          <h2 className="italic-heading">Назва стовпчика:</h2>
          <input
            className={newColumnName.trim().length > 0
              && !itemList.includes(newColumnName.trim()) ? '' : 'invalid-data'}
            type="text"
            placeholder="Назва..."
            value={newColumnName}
            onChange={(e) => setNewColumnName(e.target.value)}
          />
          <h2 className="italic-heading">Спосіб заповнення клітинок стовпчика:</h2>
          <div className="custom-select">
            <select value={newColumnFillingMethod} onChange={handleFillingMethodChange}>
              {Object.keys(fillingMethods).map(method =>
                <option value={method} key={method}>{fillingMethods[method]}</option>
              )}
            </select>
          </div>
        </>
      }

      {/*
            <fieldset>
                <legend className="section-heading">
                    Виберіть стовпчики, які хочете сумувати
                </legend>
                <div>
                    <input type="checkbox" id="cb-10" />
                    <label htmlFor="cb-10">Кількість (Стовпчик 4)</label>
                </div>
                <div>
                    <input type="checkbox" id="cb-11" />
                    <label htmlFor="cb-11">Ціна за одиницю(Стовпчик 7)</label>
                </div>
                <div>
                    <input type="checkbox" id="cb-12" />
                    <label htmlFor="cb-12">Стовпчик 5</label>
                </div>
            </fieldset> */}

      {newColumnFillingMethod === 'staticValue' &&
        <div className="subsection">
          <label htmlFor="static-value-input">Статичне значення</label>
          <input
            value={newColFillingMethodParams?.staticValue || ''}
            onChange={(e) => setNewColFillingMethodParams({ staticValue: e.target.value })}
            type="text"
            placeholder="Значення..."
            id="static-value-input" />
        </div>
      }

      {newColumnFillingMethod === 'formula' &&
        <div className="subsection">
          <label htmlFor="filling-formula-input">
            Введіть формулу, використовуючи буквенні позначення стовпчиків
          </label>

          <CustomTextInput
            placeholder="Формула..."
            id="filling-formula-input"
            value={newColFillingMethodParams?.formulaText || ''}
            letters={itemList.map((_, index) => getColumnLetters(index + 1))}
            onChange={(text) => setNewColFillingMethodParams(current => { return { ...current, formulaText: text } })}
          />

          <div>
            <input
              type="checkbox"
              id='set-as-unique-cb'
              checked={newColFillingMethodParams?.unique || false}
              onChange={(e) => setNewColFillingMethodParams(current => { return { ...current, unique: e.target.checked } })} />
            <label
              htmlFor='set-as-unique-cb'>Повідомляти про повторення</label>
          </div>
        </div>
      }

      {newColumnFillingMethod &&
        newColumnName.trim().length > 0 &&
        !itemList.includes(newColumnName.trim()) &&
        <button
          className="confirm-new-item-btn"
          onClick={() => confirmNewColumn()}
        >Підтвердити</button>
      }

      {newColumnFillingMethod &&
        <span
          className="cancel-new-item-btn"
          onClick={() => {
            setNewColumnName('')
            setNewColumnFillingMethod(null)
          }}
        >Скасувати</span>
      }

      {!newColumnFillingMethod &&
        !downloadFilename &&
        !isWaitingForResponse &&
        <button
          className="go-next-btn"
          onClick={() => sendData()}>Відправити в обробку</button>
      }

      {isWaitingForResponse &&
        <span className="loader">
          <WaitingCircle />
          обробка...
        </span>
      }

      {downloadFilename &&
        <a
          className="download-link"
          href={`${serverUrl}/download-file?filename=${downloadFilename}`}
          download>Завантажити відформатований файл</a>
      }
    </section>
  );
}

export default FinalSection;