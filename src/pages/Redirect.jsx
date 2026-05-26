import { useEffect } from "react";

const Redirect = () => {
  useEffect(() => {
    window.location.href = "https://ganamos.biz/home";
  }, []);

  return null; 
};

export default Redirect;