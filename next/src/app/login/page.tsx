"use client";

import { useEffect, useState } from "react";
import styles from "./page.module.css";
import Button from "../button/button";
import { useRouter } from "next/navigation";
import Input from "../input/input";

export default function Login() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    usernameOrEmail: "",
    password: "",
  });
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prevData) => ({
      ...prevData,
      [field]: value,
    }));
  };

  const handleSubmit = async () => {
    try {
      const response = await fetch("http://localhost:8080/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // Include cookies in the request
        body: JSON.stringify({
          usernameOrEmail: formData.usernameOrEmail,
          password: formData.password,
        }),
      });

      if (response.ok) {
        router.push("/"); // Redirect to home page after successful login
      } else {
        const errorData = await response.json();
        setError(errorData.message || "Login failed");
      }
    } catch (err) {
      console.error("Error during login:", err);
      setError("An error occurred. Please try again.");
    }
  };

  return (
    <div className={styles.main}>
      <h1 className={styles.mainText}>Login to existing account</h1>
      <div className={styles.inputs}>
      <Input
        type="text"
        maxLength={32}
        placeholder="Username or email"
        value={formData.usernameOrEmail}
        onChange={(value) => handleInputChange("usernameOrEmail", value)}
      />
      
      <Input
        type="password"
        maxLength={32}
        placeholder="Password"
        value={formData.password}
        onChange={(value) => handleInputChange("password", value)}
      />
      </div>
      
      <Button text="Login" onClick={handleSubmit} />
    </div>
  );
}