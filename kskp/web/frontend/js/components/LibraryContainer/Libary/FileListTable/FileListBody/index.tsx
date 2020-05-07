import * as React from "react";
import * as style from "./style.scss";

interface Props{
    onClick: () => void;
}

const FileListBody = (_: Props) => {
    return <tbody>
    <tr>
        <td>icon</td>
        <td>project</td>
        <td>ユーザーたろう</td>
        <td>2018/05/21 18:41</td>
    </tr>
    <tr>
        <td>icon</td>
        <td>project</td>
        <td>ユーザーたろう</td>
        <td>2018/05/21 18:41</td>
    </tr>
    <tr>
        <td>icon</td>
        <td>project</td>
        <td>ユーザーたろう</td>
        <td>2018/05/21 18:41</td>
    </tr>
    </tbody>;
};

export {FileListBody};
