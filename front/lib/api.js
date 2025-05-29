import axios from 'axios'

const api = axios.create({
  baseURL: "http://54.180.192.103:8080",
  withCredentials: true
});


export default api;
