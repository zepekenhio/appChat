const socket = io();
  let login = document.getElementById("login")
  login.onclick = async () => {
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

  };




  let register = document.getElementById("register")
  register.onclick = async () => {
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

  };




  const messages = document.getElementById("messages");



  let send = document.getElementById("send")
  send.onclick = () => {
    const text = document.getElementById("msg").value;


  };

  

