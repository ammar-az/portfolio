import Question from "../assets/icons/question-circle.svg?react";

export default function Header(){

    return (
        <div className="header">
            <button className="icon-button">
                <Question/>
            </button>
            <h1>AmmarZ</h1>
            <button></button>
        </div>
    );
}
