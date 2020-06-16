// const log = (st) => console.log(st);

// const getLocalStorage = () => {
//     let ret;
//     try{
//         ret = JSON.parse(localStorage.getItem("gameXYZstate")) || {};
//     }catch(err){
//         console.log("Error parsing localStorage");
//         localStorage.setItem("gameXYZstate", JSON.stringify("{}"))
//         ret = {}
//     }
//     return ret;
// };

// const setLocalStorage = (newLocalState) => {
//     console.assert(newLocalState, "null or undefined");
//     localStorage.setItem("gameXYZstate", JSON.stringify(newLocalState));
// };

// const isLocalhost = Boolean(
//     window.location.hostname === 'localhost' ||
//       // [::1] is the IPv6 localhost address.
//       window.location.hostname === '[::1]' ||
//       // 127.0.0.0/8 are considered localhost for IPv4.
//       window.location.hostname.match(
//         /^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/
//       )
//   );