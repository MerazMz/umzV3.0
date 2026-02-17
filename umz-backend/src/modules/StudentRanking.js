import axios from "axios";

const regno = "12301135"
const url="https://lpu-student-ranking.vercel.app/get-student-info";
const payload={"registrationNumber":regno}
console.log("Fetching data...");
axios.post(url,payload).then((response)=>{console.log(response.data)}).catch((error)=>{console.log(error)})