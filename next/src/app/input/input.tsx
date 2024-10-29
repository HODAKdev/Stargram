"use client";

import styles from "./input.module.css";
import { useState, ChangeEvent } from "react";

interface TextInputProps {
  type?: string;
  maxLength?: number;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
}

export default function TextInput({
  type = "text",
  maxLength = 32,
  placeholder = "Enter text",
  value,
  onChange
}: TextInputProps) {
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange(event.target.value);
  };

  return (
    <div>
      <input
        type={type}
        value={value}
        onChange={handleChange}
        className={styles.input}
        placeholder={placeholder}
        maxLength={maxLength}
      />
    </div>
  );
}
