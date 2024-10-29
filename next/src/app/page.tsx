"use client";

import { useEffect, useState } from "react";
import styles from "./page.module.css";
import Button from "./button/button";
import { useRouter } from "next/navigation";

interface UserData {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
}

export default function Home() {
  const router = useRouter();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleRegisterSubmit = async () => {
    router.push("/register");
  };

  const handleLoginSubmit = async () => {
    router.push("/login");
  };

  const handleLogoutSubmit = async () => {
    document.cookie = "authToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=None; Secure";
    window.location.reload();
  };

  const handleDeleteAccSubmit = async () => {
    try {
      const response = await fetch("http://localhost:8080/api/deleteacc", {
        method: "DELETE",
        credentials: "include", // Include cookies in the request
      });

      if (response.ok) {
        document.cookie = "authToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=None; Secure";
        window.location.reload(); // Reload the page after successful deletion
      } else {
        throw new Error("Failed to delete account");
      }
    } catch (error) {
      console.error("Error deleting account:", error);
      setError("Failed to delete account");
    }
  };

  useEffect(() => {
    console.log(document.cookie);

    const fetchUserData = async () => {
      try {
        const response = await fetch("http://localhost:8080/api/verify-token", {
          method: "GET",
          credentials: "include", // Include cookies in the request
        });

        if (!response.ok) {
          throw new Error("Failed to fetch user data");
        }

        const data: UserData = await response.json();
        setUserData(data); // Set user data if response is successful
      } catch (err) {
        console.error("Error fetching user data:", err);
        setError("Failed to fetch user data"); // Set error message
      }
    };

    fetchUserData(); // Call the function to fetch user data
  }, []); // Empty dependency array means this runs once on mount

  return (
    <div className={styles.main}>
      {userData ? (
   
        <div className={styles.box}>
     <h1 className={styles.mainText}><span className={styles.under}>Welcome back,</span> {userData.firstName}!</h1>
     <div className={styles.gr}>
     <h2>User data</h2>
     <div>
     <p className={styles.sText}><span className={styles.info}>First name</span> {userData.firstName}</p>
     <p className={styles.sText}><span className={styles.info}>Last name</span> {userData.lastName}</p>
     <p className={styles.sText}><span className={styles.info}>Username</span> {userData.username}</p>
     <p className={styles.sText}><span className={styles.info}>Email</span> {userData.email}</p>
     </div>
     </div>
     <div className={styles.gr}>
      <h2>User actions</h2>
      <div className={styles.buttons}>
      <Button text="Log out" onClick={handleLogoutSubmit} />
      <Button text="Delete account" onClick={handleDeleteAccSubmit} />
     </div>
     </div>
        </div>
      ) : (
        <div className={styles.main}>
<h1 className={styles.mainText}>You are logged out</h1>
<div className={styles.section}>
        <h2 className={styles.text}>Already have an account?</h2>
        <Button text="Login" onClick={handleLoginSubmit} />
        <h2 className={styles.text}>Don’t have an account?</h2>
        <Button text="Register" onClick={handleRegisterSubmit} />
      </div>
        </div>
      )}
     
    </div>
  );
}