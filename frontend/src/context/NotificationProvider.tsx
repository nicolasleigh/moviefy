// import { createContext, useState } from "react";

// export const NotificationContext = createContext();

// let timeoutId;

// function NotificationProvider({ children }) {
//   const [notification, setNotification] = useState("");
//   const [classes, setClasses] = useState("");

//   const updateNotification = (type, value) => {
//     if (timeoutId) clearTimeout(timeoutId);

//     switch (type) {
//       case "error":
//         setClasses("bg-red-500");
//         break;
//       case "success":
//         setClasses("bg-green-500");
//         break;
//       case "warning":
//         setClasses("bg-orange-500");
//         break;
//       default:
//         setClasses("bg-red-500");
//         break;
//     }
//     setNotification(value);
//     timeoutId = setTimeout(() => {
//       setNotification("");
//     }, 3000);
//   };

//   return (
//     <NotificationContext.Provider value={{ updateNotification }}>
//       {children}
//       {notification && (
//         <div className='fixed left-1/2 -translate-x-1/2 top-24'>
//           <div className='bounce-custom shadow-md rounded'>
//             <p className={classes + " text-white px-4 py-2 font-semibold"}>{notification}</p>
//           </div>
//         </div>
//       )}
//     </NotificationContext.Provider>
//   );
// }

// export default NotificationProvider;
