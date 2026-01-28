import { useState } from "react";
import Input from "../../components/index.jsx";
import Button from "../../components/button.jsx";
import { useNavigate } from "react-router-dom";

const Form = ({ isSignInPage = true }) => {
  const [data, setData] = useState({
    ...(!isSignInPage && { fullName: "" }),
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false); // ✅ Added loading state
  const [error, setError] = useState(""); // ✅ Added error state
  const [errors, setErrors] = useState({}); // ✅ Added field-specific errors

  const navigate = useNavigate();

  // ✅ Client-side validation
  const validate = () => {
    const newErrors = {};

    if (!isSignInPage && !data.fullName?.trim()) {
      newErrors.fullName = "Full name is required";
    }

    if (!data.email?.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      newErrors.email = "Invalid email format";
    }

    if (!data.password) {
      newErrors.password = "Password is required";
    } else if (data.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); // ✅ Clear previous errors

    // ✅ Validate before submitting
    if (!validate()) {
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(
        `http://localhost:3000/api/auth/${isSignInPage ? "signin" : "signup"}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(data),
        }
      );

      const result = await res.json();

      if (!res.ok) {
        setError(result.message || "Something went wrong"); // ✅ Set error message
        return;
      }

      // ✅ Success - redirect to dashboard
      navigate("/");
    } catch (error) {
      console.error("Error submitting form:", error);
      setError("Network error. Please try again."); // ✅ Handle network errors
    } finally {
      setLoading(false); // ✅ Stop loading
    }
  };

  return (
    <div className="min-h-screen bg-light flex items-center justify-center py-16">
      <div className="bg-white w-[420px] shadow-xl rounded-2xl px-10 py-14 flex flex-col items-center">
        {/* TITLE */}
        <h2 className="text-4xl font-extrabold mb-2">
          Welcome {isSignInPage && "Back"}
        </h2>

        {/* SUBTITLE */}
        <p className="text-lg font-light mb-10 text-gray-600 text-center">
          {isSignInPage
            ? "Sign in to get explored"
            : "Sign up to get started"}
        </p>

        {/* ✅ GLOBAL ERROR MESSAGE */}
        {error && (
          <div className="w-full mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600 text-center">{error}</p>
          </div>
        )}

        {/* FORM */}
        <form onSubmit={handleSubmit} className="w-full flex flex-col items-center">
          {!isSignInPage && (
            <Input
              label="Full name"
              id="fullName"
              placeholder="Enter your full name"
              className="mb-5 w-full"
              value={data.fullName}
              onChange={(e) => {
                setData({ ...data, fullName: e.target.value });
                setErrors({ ...errors, fullName: "" }); // ✅ Clear error on change
              }}
              error={errors.fullName} // ✅ Show field error
              disabled={loading} // ✅ Disable during loading
            />
          )}

          <Input
            label="Email address"
            id="email"
            type="email"
            placeholder="Enter your email"
            className="mb-5 w-full"
            value={data.email}
            onChange={(e) => {
              setData({ ...data, email: e.target.value });
              setErrors({ ...errors, email: "" }); // ✅ Clear error on change
            }}
            error={errors.email} // ✅ Show field error
            disabled={loading} // ✅ Disable during loading
            autoComplete="email" // ✅ Better autocomplete
          />

          <Input
            label="Password"
            id="password"
            type="password"
            placeholder="Enter your password"
            className="mb-8 w-full"
            value={data.password}
            onChange={(e) => {
              setData({ ...data, password: e.target.value });
              setErrors({ ...errors, password: "" }); // ✅ Clear error on change
            }}
            error={errors.password} // ✅ Show field error
            disabled={loading} // ✅ Disable during loading
            autoComplete={isSignInPage ? "current-password" : "new-password"} // ✅ Better autocomplete
          />

          <Button
            label={
              loading
                ? "Loading..."
                : isSignInPage
                ? "Sign in"
                : "Sign up"
            }
            type="submit"
            className="w-full rounded-full py-3"
            disabled={loading} // ✅ Disable during loading
            loading={loading} // ✅ Show loading spinner (if Button supports it)
          />
        </form>

        {/* TOGGLE */}
        <div className="mt-6 text-sm text-gray-600">
          {isSignInPage
            ? "Didn't have an account?"
            : "Already have an account?"}{" "}
          <span
            className="text-primary cursor-pointer font-medium underline hover:text-blue-700 transition"
            onClick={() => {
              if (!loading) { // ✅ Prevent navigation during loading
                setError(""); // ✅ Clear errors
                setErrors({}); // ✅ Clear field errors
                navigate(`/users/${isSignInPage ? "sign-up" : "sign-in"}`);
              }
            }}
          >
            {isSignInPage ? "Sign up" : "Sign in"}
          </span>
        </div>
      </div>
    </div>
  );
};

export default Form;