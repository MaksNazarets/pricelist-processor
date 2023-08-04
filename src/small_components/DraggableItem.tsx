import React, { useState } from 'react'
import { fillingMethods } from '../FinalSection'
import { DraggableProvided } from 'react-beautiful-dnd'

const fillingMethodPropertyName: { [key: string]: string } = {
  value: 'Значення',
  formulaText: 'Структура',
  unique: 'Унікальне'
}

type Props = {
  provided: DraggableProvided,
  colName: string,
  isNewColumn: boolean,
  fillingMethod?: { [key: string]: any },
  letter: string,
  onRemoveButtonClick: () => void
}


export const DraggableItem = ({ provided, colName, isNewColumn, fillingMethod, letter, onRemoveButtonClick }: Props) => {
  const [showParams, setShowParams] = useState(false)

  return (
    <div
      className="draggable-item"
      ref={provided.innerRef}
      {...provided.dragHandleProps}
      {...provided.draggableProps}
    >
      <div className="left-part">
        <div className="drag-burger">
          <div></div>
          <div></div>
          <div></div>
        </div>
        <span>{colName}</span>
      </div>
      <div className="right-part">
        {isNewColumn
          &&
          <div
            className="item-parameters-btn"
            onClick={() => setShowParams(!showParams)}
          > ⋯
            {
              showParams &&
              <div className="new-col-details">
                <span><b>Метод: </b>{fillingMethods[fillingMethod?.name]}</span>
                <br />

                {
                  fillingMethod &&
                  Object.entries(fillingMethod).map(([key, value]: [string, any]) => {
                    if (key !== 'name') {
                      let valstr = value.toString()

                      if (typeof (value) === 'boolean')
                        valstr = value ? 'так' : 'ні'

                      return <React.Fragment key={key}>
                        <span><b>{fillingMethodPropertyName[key] || key}: </b> {valstr}</span>
                        <br />
                      </React.Fragment>
                    }
                  })
                }
              </div>
            }
          </div>
        }
        <span className="col-letter">{letter}</span>
        <span className="remove-btn" onClick={() => onRemoveButtonClick()}>&#x2715;</span>
      </div>
    </div>
  )
}
