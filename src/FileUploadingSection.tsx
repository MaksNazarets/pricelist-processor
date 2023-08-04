import axios from "axios";
import { ChangeEvent, useContext, useState } from "react";
import { serverUrl } from "./constants";
import { MainContext, file } from "./App";
import WaitingCircle from "./small_components/WaitingCircle";

const FileUploadingSection = () => {
    const fileNotUploadedText = 'Нічого не вибрано...';
    const { fileUploaded, setFileUploaded, fileInputRef } = useContext(MainContext)
    const [isWaitingForResponse, setIsWaitingForResponse] = useState<boolean[]>([false, false])
    const [tableStartCell, setTableStartCell] = useState('A1')
    const [sheetList, setSheetList] = useState<string[]>([])
    const [isSuccessfullConnection, setIsSuccessfullConnection] = useState(false)

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (fileInputRef.current && fileInputRef.current.files && fileInputRef.current.files.length > 0) {
            const selectedFileName = fileInputRef.current.files[0].name;
            const fileExtension = selectedFileName.split('.').pop();

            if (fileExtension !== 'xlsx')
                fileInputRef.current!.value = '';
            else {
                setFileUploaded({ fileName: e.target.files![0].name || '' })
                setIsWaitingForResponse(current => [true, current[1]])
                const formData = new FormData();
                formData.append('file', e.target.files![0]);

                axios.post(serverUrl + '/get-sheets', formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                }).then((response) => {
                    // console.log('Success: ', response.data)
                    setIsWaitingForResponse(current => [false, current[1]])
                    setIsSuccessfullConnection(true)
                    setSheetList(response.data)
                    setFileUploaded((current: file) => {
                        return {
                            ...current,
                            selectedSheetName: response.data[0],
                            tableStartCell: tableStartCell
                        }
                    })
                }).catch((error) => {
                    console.error('Error uploading file:', error);
                    setIsWaitingForResponse(current => [false, current[1]])
                    setIsSuccessfullConnection(false)
                    setFileUploaded({})
                })
            }
        }
    }

    const isValidExcelCellAddress = (address: string) => {
        const regex = /^[A-Za-z]{1,3}[1-9]\d*$/;
        return regex.test(address);
    }

    const handleStartCellChange = (event: ChangeEvent<HTMLInputElement>) => {
        setTableStartCell(event.target.value)
        setFileUploaded((current: file) => {
            const { columns, columnsRenamed, ...changed } = current;

            return changed;
        })
    }

    const resetSelectedFile = () => {
        fileInputRef.current!.value = '';
        setFileUploaded({})
        setSheetList([])
    }

    const handleSheetChange = (e: ChangeEvent<HTMLSelectElement>) => {
        setFileUploaded((current: file) => {
            const { columns, columnsRenamed, ...changed } = current;
            return {
                ...changed,
                selectedSheetName: e.target.value
            }
        })
    }

    const goNext = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
        e.preventDefault()

        const formData = new FormData();
        formData.append('file', fileInputRef.current.files[0]);
        formData.append('sheetName', fileUploaded.selectedSheetName);
        formData.append('tableStart', tableStartCell);

        setIsWaitingForResponse(current => [current[0], true])


        axios.post(serverUrl + '/get-cols', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        }).then((response) => {
            // console.log(response.data);
            setIsWaitingForResponse(current => [current[0], false])

            setFileUploaded((current: file) => {
                const { hasCategoryRows, columnsRenamed, ...changed } = current;
                return {
                    ...changed,
                    columns: response.data.columns,
                    hasCategoryRows: response.data.hasCategoryRows,
                    tableStartCell: tableStartCell
                }
            })
        }).catch((error) => {
            setIsWaitingForResponse(current => [current[0], false])
            console.log(error)
        })
    }

    return (
        <section>
            <h2 className="section-heading">Завантажте файл з розширенням .xlsx</h2>
            <form>
                <div className="file-picker-wrapper">
                    <input
                        type="file"
                        name="main-file"
                        id="main-file-input"
                        accept=".xlsx"
                        ref={fileInputRef}
                        onChange={handleFileUpload} />
                    <button
                        type="button"
                        className="pick-file-btn"
                        onClick={() => { fileInputRef.current!.click() }}>Вибрати файл</button>
                    <div className="picked-file">
                        <span>{fileUploaded.fileName || fileNotUploadedText}</span>
                        {fileUploaded.fileName && <span className="remove-file-btn" onClick={() => resetSelectedFile()}>&#x2715;</span>}
                    </div>
                </div>

                {
                    isWaitingForResponse[0] &&
                    <span className="loader">
                        <WaitingCircle />
                        зачекайте...
                    </span>
                }

                {
                    sheetList.length > 0 && isSuccessfullConnection &&
                    <>
                        <h2 className="section-heading">Вкажіть лист та адресу лівої верхньої комірки таблиці</h2>
                        <div className="two-cols">
                            <select value={fileUploaded.selectedSheetName} onChange={handleSheetChange}>
                                {
                                    sheetList.map((sheetName: string) =>
                                        <option key={sheetName} value={sheetName}>{sheetName}</option>)
                                }
                            </select>
                            <input
                                className={isValidExcelCellAddress(tableStartCell) ? '' : 'invalid-data'}
                                type="text"
                                placeholder="Адреса комірки..."
                                value={tableStartCell}
                                onChange={handleStartCellChange} />
                        </div>
                        {
                            isValidExcelCellAddress(tableStartCell) &&
                            !fileUploaded.columns &&
                            <button
                                type="submit"
                                className="go-next-btn"
                                onClick={goNext}>Продовжити</button>
                        }
                    </>
                }

                {
                    isWaitingForResponse[1] &&
                    <span className="loader">
                        <WaitingCircle />
                        обробка...
                    </span>
                }
            </form>
        </section >
    );
}

export default FileUploadingSection;