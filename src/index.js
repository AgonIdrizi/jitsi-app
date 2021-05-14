import React, { useEffect } from "react";
import ReactDOM from "react-dom";
import "./index.css";
import App from "./App";
import reportWebVitals from "./reportWebVitals";
import { useLocalStorageState } from './hooks/useLocalStorage'

const UserPermission = ({children}) => {
  const [havePermissions, setHavePermissions] = useLocalStorageState('havePermissions',false)

  useEffect(() => {
    const permissions = navigator.mediaDevices.getUserMedia({audio: true, video: true})
    permissions.then((stream) => {
     if(stream.active){
      setHavePermissions(true) 
      console.log('stream active', stream)
     }
      
    })
    .catch((err) => {
      setHavePermissions(false)
      console.log(`${err.name} : ${err.message}`)
    });
    
  }, [])
  return havePermissions ? children : <div>Please enable camera&microphone and refresh page to join conference</div>
}



ReactDOM.render(
  <React.StrictMode>
    <UserPermission ><App /></UserPermission>
  </React.StrictMode>,
  document.getElementById("root")
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
