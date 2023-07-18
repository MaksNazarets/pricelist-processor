import { ChangeEvent, useContext, useState } from "react";
import { MainContext, file } from "./App";

const ColumnsHandlerSection = () => {
    const { fileUploaded, setFileUploaded } = useContext(MainContext)
    const [checkboxesStates, setCheckboxesStates] = useState(() => {
        let init: { [key: string]: any } = {}

        fileUploaded.columns.forEach((col: string) => init[col] = col)
        return init;
    })

    const [categoryColumn, setCategoryColumn] = useState({
        exists: false,
        name: ''
    })

    const resetCurrentProgress = () => {
        setFileUploaded((current: file) => {
            const { columnsRenamed, categoryColumnName, ...changed } = current;

            return changed;
        })
    }

    const handleCheckboxChange = (e: ChangeEvent<HTMLInputElement>, col: string) => {
        resetCurrentProgress();
        setCheckboxesStates(current => {
            let newState = { ...current };
            newState[col] = e.target.checked ? col : false
            return newState
        })
    }

    const handleColNameChange = (e: ChangeEvent<HTMLInputElement>, col: string) => {
        resetCurrentProgress();
        setCheckboxesStates(current => {
            let newState = { ...current };
            newState[col] = e.target.value
            return newState
        })
    }

    const handleCategoryColChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        resetCurrentProgress();
        setCategoryColumn(current => {
            return {
                ...current,
                name: e.target.value
            }
        })
    }

    const handleGoNext = () => setFileUploaded(
        (current: file) => {

            // const selectedCols = { ...checkboxesStates }
            // Object.keys(selectedCols).forEach(colName => {
            //     if (!selectedCols[colName] || selectedCols[colName].trim().length === 0)
            //         delete selectedCols[colName]
            // })

            if (categoryColumn.exists) {
                // const { hasCategoryRows, ...changed } = current;

                return {
                    ...current,
                    columnsRenamed: checkboxesStates,
                    categoryColumnName: categoryColumn.name.trim()
                }
            }
            else {
                const { categoryColumnName, ...changed } = current;

                return {
                    ...changed,
                    columnsRenamed: checkboxesStates,
                }
            }
        })

    return (
        <section id="columns-section">
            {
                fileUploaded.columns.length > 0 ?
                    <>
                        <fieldset>
                            <legend className="section-heading">
                                Виберіть необхідні наявні стовпчики:
                            </legend>
                            <table>
                                <tbody>
                                    {
                                        fileUploaded.columns.map((col: string, index: number) =>
                                            <tr key={col} className="">
                                                <td>
                                                    <div>
                                                        <input
                                                            type="checkbox"
                                                            id={"cb-" + index}
                                                            checked={checkboxesStates[col] !== false}
                                                            onChange={(e) => handleCheckboxChange(e, col)} />
                                                        <label
                                                            className={checkboxesStates[col] !== false &&
                                                                String(checkboxesStates[col]).trim().length === 0 ? 'invalid-data' : ''}
                                                            htmlFor={"cb-" + index}>{col}</label>
                                                    </div>
                                                </td>
                                                <td><input
                                                    className={checkboxesStates[col] !== false &&
                                                        String(checkboxesStates[col]).trim().length === 0 ? 'invalid-data' : ''}
                                                    type="text"
                                                    placeholder="Нова назва..."
                                                    value={checkboxesStates[col] === false ? '' : checkboxesStates[col]}
                                                    onChange={(e) => handleColNameChange(e, col)}
                                                    disabled={checkboxesStates[col] === false} /></td>
                                            </tr>)
                                    }
                                </tbody>
                            </table>
                            {
                                (fileUploaded.hasCategoryRows || fileUploaded.categoryColumnName) &&
                                <>
                                    <div>
                                        <input
                                            type="checkbox"
                                            id="see-dividers-cb"
                                            checked={categoryColumn.exists}
                                            onChange={(e) => {
                                                resetCurrentProgress();
                                                setCategoryColumn(current => {
                                                    return {
                                                        exists: e.target.checked,
                                                        name: e.target.checked ? current.name : ''
                                                    }
                                                })
                                            }} />
                                        <label htmlFor="see-dividers-cb">
                                            Винести дані з горизонтальних роздільників в окремий стовпчик
                                        </label>
                                    </div>
                                    <input
                                        className={categoryColumn.exists
                                            && categoryColumn.name.trim().length > 0
                                            && !Object.keys(checkboxesStates).includes(categoryColumn.name) ? '' : 'invalid-data'}
                                        type="text"
                                        id="divider-col-name"
                                        placeholder="Назва стовпчика..."
                                        value={categoryColumn.name}
                                        onChange={handleCategoryColChange}
                                        disabled={!categoryColumn.exists}
                                    />
                                </>
                            }
                        </fieldset>
                        {
                            Object.keys(checkboxesStates).filter(cb => checkboxesStates[cb]).length > 0 &&
                            ((categoryColumn.exists
                                && categoryColumn.name.trim().length > 0
                                && !Object.keys(checkboxesStates).includes(categoryColumn.name)) || !categoryColumn.exists)
                            && !fileUploaded.columnsRenamed &&
                            <button
                                className="go-next-btn"
                                onClick={() => handleGoNext()}
                            >Продовжити</button>
                        }
                    </>
                    :
                    <span>В зазначеній комірці шапки таблиці не виявлено...</span>
            }

        </section >
    );
}

export default ColumnsHandlerSection;