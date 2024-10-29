import styles from "./button.module.css";
import { MouseEventHandler } from "react";

interface ButtonProps {
  text: string;
  type?: "button" | "submit" | "reset"; // Optional button type
  onClick?: MouseEventHandler<HTMLButtonElement>; // Optional onClick handler
}

export default function Button({
  text,
  type = "button",
  onClick,
}: ButtonProps) {
  return (
    <button type={type} className={styles.button} onClick={onClick}>
      {text}
    </button>
  );
}
