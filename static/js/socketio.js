/*----------------------for 營養師*/
let user;
 /*{"23":
    {
     name:xxx,
     status:0 or 1,
     nutri_read: -1,
     nutri_unread: 12345767,
     is_typing : false,
     is_typing_timer : null,   
    }       
}*/
let nutri_socket;
let on_which_user;
/*--------------------for 使用者*/
let nutritionist;
 /*{"23":
    {
     name:xxx,
     status:0 or 1,
     user_read: -1,
     user_unread: 12345767,
     is_typing : false,
     is_typing_timer : null,  
    }       
}*/
let user_socket;
let on_which_nutri;


//有一個鎖和buffer message list,用來處理塊未讀訊息時,同時有人傳訊息
let lock=false;
let buffer_message_list=[];
//another lock for scrolling
let scroll_lock=false;



function cancel_typing(who,on_who){
    let dot_box = document.querySelector(".dot-box");
    if(dot_box){
        dot_box.remove()
    };
    if(who === "nutri"){
        user[on_who]["is_typing"] = false;
        user[on_who]["is_typing_timer"] = null;
    }else{
        nutritionist[on_who]["is_typing"] = false;
        nutritionist[on_who]["is_typing_timer"] = null;
    };
};




function generate_msg_time_format(time){
    let message_time = new Date(time);
    let year = message_time.getFullYear(); //2022
    let month = message_time.getMonth()  //4
    let date = message_time.getDate();   //28
    let hour = message_time.getHours();
    let minute = message_time.getMinutes();
    //要顯示的訊息時間格式
    let message_time_format = String(year)+"/"+ String(month+1) + "/" + String(date) + " " + String(hour) + ":" + String(minute)    
    return message_time_format
}





//使用者要與營養師的已讀訊息
async function get_read_message_with_nutri(etime){
    let jwt = localStorage.getItem("JWT");
    try{
        let response = await fetch(`/api/read-message?etime=${etime}&identity=2&id=${on_which_nutri}`,{
                                                method: 'get',
                                                headers: {"Authorization" : `Bearer ${jwt}`}
                                                });
        let result = await response.json();                                
        if(response.ok){  //200情況下  
            //顯示出來
            let message_number;
            if(result["data"].length===11){ //更新最早的訊息時間
                message_number = result["data"].length-1;
                nutritionist[on_which_nutri]["oldest_time"] = result["data"][10]["time"] 
            }else if(result["data"].length>0 && result["data"].length<11){
                message_number = result["data"].length;
                nutritionist[on_which_nutri]["oldest_time"] = null;
            }else{
                message_number = 0
            };   
            let log_div = document.getElementById("log-"+on_which_nutri);
            let display_message_section =document.querySelector(".display-message-section");
            for(let i=0;i<message_number;i++){
                let message_box;
                if(result["data"][i]["by"]==="n"+on_which_nutri){
                    let message_time_format = generate_msg_time_format(result["data"][i]["time"]);
                    message_box = create_message_box(nutritionist[on_which_nutri]["name"],result["data"][i]["msg"],message_time_format,result["data"][i]["time"]);
                }else{
                    let my_name = document.querySelector(".username").textContent;
                    let message_time_format = generate_msg_time_format(result["data"][i]["time"]);
                    message_box = create_message_box(my_name,result["data"][i]["msg"],message_time_format,result["data"][i]["time"]);
                }; 
                if(log_div.firstChild){
                    log_div.firstChild.before(message_box);
                    display_message_section.scrollTop =  display_message_section.scrollHeight/2;
                }else{
                    log_div.appendChild(message_box);
                    display_message_section.scrollTop = display_message_section.scrollHeight/2;
                };
            };    
            //最後確認buffet list裡面有沒有訊息要顯示
            if(buffer_message_list.length>0){
                for(let i=0;i<buffer_message_list.length;i++){
                    log_div.appendChild(buffer_message_list[i]) 
                };
                buffer_message_list = [];
                display_message_section.scrollTop =  display_message_section.scrollHeight;
            };
            lock = false;
            scroll_lock = false;
        }else if(response.status === 403){ //拒絕存取
            console.log('JWT已失效,請重新登入');
            localStorage.removeItem("JWT");
            window.location.href = '/';
        }else if(response.status === 500){ //如果是500,代表伺服器(資料庫)內部錯誤
            console.log(result);
        };
    }catch(message){
        console.log(`${message}`)
        throw Error('Fetching was not ok!!.')
    }; 
};



//使用者要與營養師的未讀訊息
async function get_unread_message_with_nutri(stime,etime){
    let jwt = localStorage.getItem("JWT");
    try{
        let response = await fetch(`/api/unread-message?stime=${stime}&etime=${etime}&identity=2&id=${on_which_nutri}`,{
                                                method: 'get',
                                                headers: {"Authorization" : `Bearer ${jwt}`}
                                                });
        let result = await response.json();                                
        if(response.ok){  //200情況下  
            //馬上再打已讀訊息API
            get_read_message_with_nutri(stime);
            //顯示出來 
            let log_div = document.getElementById("log-"+on_which_nutri);
            let display_message_section =document.querySelector(".display-message-section");
            for(let i=0;i<result["data"].length;i++){
                let message_box;
                if(result["data"][i]["by"]==="n"+on_which_nutri){
                    let message_time_format = generate_msg_time_format(result["data"][i]["time"]);
                    message_box = create_message_box(nutritionist[on_which_nutri]["name"],result["data"][i]["msg"],message_time_format,result["data"][i]["time"]);
                }else{
                    let my_name = document.querySelector(".username").textContent;
                    let message_time_format = generate_msg_time_format(result["data"][i]["time"]);
                    message_box = create_message_box(my_name,result["data"][i]["msg"],message_time_format,result["data"][i]["time"]);
                }; 
                if(log_div.firstChild){
                    log_div.firstChild.before(message_box);
                    display_message_section.scrollTop =  display_message_section.scrollHeight;
                }else{
                    log_div.appendChild(message_box);
                    display_message_section.scrollTop = display_message_section.scrollHeight;
                };
            };  
            //最後把unread標誌拿掉
            let unread_img = document.getElementById(on_which_nutri).getElementsByClassName("nutri-name")[0].getElementsByClassName("unread")[0]
            unread_img.remove();
        }else if(response.status === 403){ //拒絕存取
            console.log('JWT已失效,請重新登入');
            localStorage.removeItem("JWT");
            window.location.href = '/';
        }else if(response.status === 500){ //如果是500,代表伺服器(資料庫)內部錯誤
            console.log(result);
        };
    }catch(message){
        console.log(`${message}`)
        throw Error('Fetching was not ok!!.')
    };
};    





//營養師要與使用者的已讀訊息
async function get_read_message_with_user(etime){
    let jwt = localStorage.getItem("JWT");
    try{
        let response = await fetch(`/api/read-message?etime=${etime}&identity=1&id=${on_which_user}`,{
                                                method: 'get',
                                                headers: {"Authorization" : `Bearer ${jwt}`}
                                                });
        let result = await response.json();                                
        if(response.ok){  //200情況下  
            //顯示出來
            let message_number;
            if(result["data"].length===11){ //更新最早的訊息時間
                message_number = result["data"].length-1;
                user[on_which_user]["oldest_time"] = result["data"][10]["time"] 
            }else if(result["data"].length>0 && result["data"].length<11){
                message_number = result["data"].length;
                user[on_which_user]["oldest_time"] = null;
            }else{
                message_number = 0
            };   
            let log_div = document.getElementById("log-"+on_which_user);
            let display_message_section =document.querySelector(".display-message-section");
            for(let i=0;i<message_number;i++){
                let message_box;
                if(result["data"][i]["by"]==="u"+on_which_user){
                    let message_time_format = generate_msg_time_format(result["data"][i]["time"]);
                    message_box = create_message_box(user[on_which_user]["name"],result["data"][i]["msg"],message_time_format,result["data"][i]["time"]);
                }else{
                    let my_name = document.querySelector(".username").textContent;
                    let message_time_format = generate_msg_time_format(result["data"][i]["time"]);
                    message_box = create_message_box(my_name,result["data"][i]["msg"],message_time_format,result["data"][i]["time"]);
                }; 
                if(log_div.firstChild){
                    log_div.firstChild.before(message_box);
                    display_message_section.scrollTop =  display_message_section.scrollHeight/2;
                }else{
                    log_div.appendChild(message_box);
                    display_message_section.scrollTop = display_message_section.scrollHeight/2;
                };
            };    
            //最後確認buffet list裡面有沒有訊息要顯示
            if(buffer_message_list.length>0){
                for(let i=0;i<buffer_message_list.length;i++){
                    log_div.appendChild(buffer_message_list[i]) 
                };
                buffer_message_list = [];
                display_message_section.scrollTop =  display_message_section.scrollHeight;
                console.log('清空buffer list');
            };
            lock = false;
            scroll_lock = false;
        }else if(response.status === 403){ //拒絕存取
            console.log('JWT已失效,請重新登入');
            localStorage.removeItem("JWT");
            window.location.href = '/';
        }else if(response.status === 500){ //如果是500,代表伺服器(資料庫)內部錯誤
            console.log(result);
        };
    }catch(message){
        console.log(`${message}`)
        throw Error('Fetching was not ok!!.')
    }; 
};


//營養師要與使用者的未讀訊息
async function get_unread_message_with_user(stime,etime){
    let jwt = localStorage.getItem("JWT");
    console.log('hihihi');
    try{
        if(!stime){
            stime = -1;
        };
        let response = await fetch(`/api/unread-message?stime=${stime}&etime=${etime}&identity=1&id=${on_which_user}`,{
                                                method: 'get',
                                                headers: {"Authorization" : `Bearer ${jwt}`}
                                                });
        let result = await response.json(); 
        console.log(result);                               
        if(response.ok){  //200情況下  
            console.log('200喔');
            console.log(result["data"]);
            //顯示出來 
            let log_div = document.getElementById("log-"+on_which_user);
            let display_message_section =document.querySelector(".display-message-section");
            for(let i=0;i < result["data"].length;i++){
                let message_box;
                console.log(result["data"]);
                if(result["data"][i]["by"]==="u"+on_which_user){
                    console.log('uuuuu')
                    let message_time_format = generate_msg_time_format(result["data"][i]["time"]);
                    message_box = create_message_box(user[on_which_user]["name"],result["data"][i]["msg"],message_time_format,result["data"][i]["time"]);
                    console.log(message_box);
                }else{
                    console.log('jjj')
                    let my_name = document.querySelector(".username").textContent;
                    let message_time_format = generate_msg_time_format(result["data"][i]["time"]);
                    message_box = create_message_box(my_name,result["data"][i]["msg"],message_time_format,result["data"][i]["time"]);
                    console.log(message_box);
                }; 
                console.log('hjhjhjhj');
                if(log_div.firstChild){
                    log_div.firstChild.before(message_box);
                    display_message_section.scrollTop =  display_message_section.scrollHeight;
                }else{
                    log_div.appendChild(message_box);
                    display_message_section.scrollTop = display_message_section.scrollHeight;
                };
            };  
            //最後把unread標誌拿掉
            let unread_img = document.getElementById(on_which_user).getElementsByClassName("user-name")[0].getElementsByClassName("unread")[0]
            unread_img.remove();
            //馬上再打已讀訊息API(如果有才要打,因為有可能是使用者傳給營養師,營養師第一次點開,所以根本沒有nutri_read)
            if(stime!=-1){ 
                get_read_message_with_user(stime);
            }else{
                lock = false;
            };
        }else if(response.status === 403){ //拒絕存取
            console.log('JWT已失效,請重新登入');
            localStorage.removeItem("JWT");
            window.location.href = '/';
        }else if(response.status === 500){ //如果是500,代表伺服器(資料庫)內部錯誤
            console.log(result);
        };
    }catch(message){
        console.log(`${message}`)
        throw Error('Fetching was not ok!!.')
    };
};





function create_status_container(){
    let status_container = document.createElement("div");
    status_container.classList.add("status-container");
    return status_container
}


//產生營養師個別狀態div
function render_nutri(nutri_id,nutri_data){
    let nutri_div = document.createElement("div");
    nutri_div.classList.add("status");
    nutri_div.id = nutri_id;
    let status_photo_container = document.createElement("div");
    status_photo_container.classList.add("status-photo-container");
    let status_img = new Image();
    status_img.src = "/picture/face.png";
    status_img.classList.add("status-photo");
    let div = document.createElement("div"); 
    div.classList.add("status-light");
    if(nutri_data["status"]===1){
        div.classList.add("online");
    };
    status_photo_container.appendChild(status_img);
    status_photo_container.appendChild(div);
    let span = document.createElement("span");
    span.classList.add("nutri-name");
    let p = document.createElement("p");
    p.appendChild(document.createTextNode(nutri_data["name"]));
    span.appendChild(p);
    if(nutri_data["user_unread"]>0){ //代表有最後一筆未讀的訊息時間,有未讀
        let unread_img = document.createElement("i");
        unread_img.setAttribute("data-feather","message-circle");
        //unread_img.src="/picture/unread.png";
        unread_img.classList.add("unread");
        span.appendChild(unread_img);
    }; 
    nutri_div.appendChild(status_photo_container);
    nutri_div.appendChild(span);
    nutri_div.addEventListener("click",function(){ //按下後產生與該營養師的對話
        if(on_which_nutri !== nutri_id){ //如果按下去不等於目前所在的營養師對話筐,才要換
            if(on_which_nutri){
                nutritionist[on_which_nutri]["oldest_time"] = null;
                nutritionist[on_which_nutri]["is_typing"] = false;
                if(nutritionist[on_which_nutri]["is_typing_timer"]){
                    clearTimeout(nutritionist[on_which_nutri]["is_typing_timer"]);
                    let dot_box = document.querySelector(".dot-box");
                    if(dot_box){
                            dot_box.remove();
                    };
                };
            };
            on_which_nutri = nutri_id;
            //看看有沒有user_read/unread in nutritionist
            if(nutritionist[nutri_id]["user_read"]===-1 && nutritionist[nutri_id]["user_unread"]===-1){
                console.log("與該營養師沒有對話紀錄");//代表與該營養師沒有對話過
            }else{ //代表與該營養師有對話過
                lock = true; //要先鎖起來,以免有人突然傳訊息過來
                if(!nutritionist[nutri_id]["user_unread"] || nutritionist[nutri_id]["user_unread"]<0){
                    //代表沒有未讀訊息,打已讀API就好,取完後不管有沒有未讀標誌都要拿掉                    
                    get_read_message_with_nutri(nutritionist[nutri_id]["user_read"]);
                }else{ //代表要已讀跟未讀,打兩個API,先打未讀API,取完後不管有沒有未讀標誌都要拿掉
                    let temp_user_unread = nutritionist[nutri_id]["user_unread"];
                    let temp_user_read = nutritionist[nutri_id]["user_read"];
                    nutritionist[nutri_id]["user_unread"]= -1;
                    nutritionist[nutri_id]["user_read"]= temp_user_unread;
                    user_socket.emit("update_user_read_unread",{"user_read":nutritionist[nutri_id]["user_read"],"user_unread":-1,"nutri_id":on_which_nutri});                  
                    get_unread_message_with_nutri(temp_user_read,temp_user_unread);                   
                };
            };
            let display_message_section = document.querySelector(".display-message-section");
            while(display_message_section.firstChild){
                display_message_section.removeChild(display_message_section.firstChild);
            }; //都先移掉全部對話
            //生成對話筐(打完API後會把訊息塞到這個框裡)
            let msg_div = document.createElement("div");
            msg_div.setAttribute("id","log-"+nutri_id);
            msg_div.classList.add("log");
            display_message_section.appendChild(msg_div);
        };
    });
    return nutri_div;
}


//產生使用者個別狀態div
function render_user(user_id,user_data){
    let user_div = document.createElement("div");
    user_div.classList.add("status");
    user_div.id = user_id;
    let status_photo_container = document.createElement("div");
    status_photo_container.classList.add("status-photo-container");
    let status_img = new Image();
    status_img.src = "/picture/face.png";
    status_img.classList.add("status-photo");
    let div = document.createElement("div"); 
    div.classList.add("status-light");
    if(user_data["status"]===1){
        div.classList.add("online");
    };
    status_photo_container.appendChild(status_img);
    status_photo_container.appendChild(div);
    let span = document.createElement("span");
    span.classList.add("user-name");
    span.appendChild(document.createTextNode(user_data["name"]));
    if(user_data["nutri_unread"]>0){ //代表有最後一筆未讀的訊息時間,有未讀
        let unread_img = document.createElement("i");
        unread_img.setAttribute("data-feather","message-circle");
        unread_img.classList.add("unread");
        span.appendChild(unread_img);
    }; 
    user_div.appendChild(status_photo_container);
    user_div.appendChild(span);
    user_div.addEventListener("click",function(){  //按下後產生與該使用者的對話
        if(on_which_user !== user_id){ //如果按下去不等於目前所在的使用者對話筐,才要換
            //一定是與該使用者有對話過(因為是使用者主動傳訊)
            if(on_which_user){
                user[on_which_user]["oldest_time"] = null;
                user[on_which_user]["is_typing"] = false;
                if(user[on_which_user]["is_typing"]["is_typing_timer"]){
                    clearTimeout(user[on_which_user]["is_typing_timer"]);
                    let dot_box = document.querySelector(".dot-box");
                    if(dot_box){
                            dot_box.remove();
                    };
                };
            };
            on_which_user = user_id;
            lock = true; //要先鎖起來,以免有人突然傳訊息過來
            if(!user[user_id]["nutri_unread"] || user[user_id]["nutri_unread"]<0){
                //代表沒有未讀訊息,打已讀API就好                   
                get_read_message_with_user(user[user_id]["nutri_read"]);
            }else{ //代表要已讀跟未讀,打兩個API,先打未讀API,取完後不管有沒有未讀標誌都要拿掉
                let temp_nutri_unread = user[user_id]["nutri_unread"];
                let temp_nutri_read = user[user_id]["nutri_read"]; //(可能是undefined)nutri_read一開始可能是沒有的,因為可能是使用者先傳後,營養師第一次點開
                user[user_id]["nutri_unread"]= -1;
                user[user_id]["nutri_read"]= temp_nutri_unread;
                console.log(temp_nutri_read);
                nutri_socket.emit("update_nutri_read_unread",{"nutri_read":user[user_id]["nutri_read"],"nutri_unread":-1,"user_id":on_which_user});                  
                get_unread_message_with_user(temp_nutri_read,temp_nutri_unread);                   
            };
            let display_message_section = document.querySelector(".display-message-section");
            while(display_message_section.firstChild){
                display_message_section.removeChild(display_message_section.firstChild);
            }; //都先移掉全部對話
            //生成對話筐(打完API後會把訊息塞到這個框裡)
            let msg_div = document.createElement("div");
            msg_div.setAttribute("id","log-"+user_id);
            msg_div.classList.add("log");
            display_message_section.appendChild(msg_div);
        };        
    });
    return user_div;
};


//顯示訊息
function create_message_box(name,message,time,timestamp){
    let msg_box = document.createElement('div');
    let name_span = document.createElement('span');
    let time_span = document.createElement('span');
    time_span.classList.add("message-time");
    time_span.id=timestamp;
    let msg_div = document.createElement('div'); //放訊息文字的div
    msg_div.classList.add("msg-div") //放訊息文字的div
    name_span.appendChild(document.createTextNode(name));
    time_span.appendChild(document.createTextNode(time));
    msg_div.appendChild(document.createTextNode(message)); //放訊息文字的div
    msg_box.appendChild(name_span);
    msg_box.appendChild(time_span);
    msg_box.appendChild(msg_div);
    msg_box.classList.add('msg-box');
    return msg_box

}




//認證通過後,進入helper頁面JWT認證通過才進行socket連線
function connect_socket(identity){
    let jwt = localStorage.getItem("JWT"); 
    if(identity === 1){ //如果是使用者
        user_socket = io('/user',{auth: {token: jwt, record:2}}); //record:2代表從helper頁面連線
        user_socket.on("authentication_pass",function(data){ //如果認證通過才要渲染出諮詢頁面
            let navmenu = document.querySelector(".navmenu");
            render_user_profile(navmenu,data["user_data"]); 
            //顯示營養師狀態
            let status_container = create_status_container();
            nutritionist = data["nutri_for_user"];  //營養師資訊
            for(let nutri_id in nutritionist){
                let nutri_div = render_nutri(nutri_id,nutritionist[nutri_id])
                status_container.appendChild(nutri_div);
            };
            navmenu.appendChild(status_container);
            feather.replace();
            render_log_out(navmenu);
            //把右邊顯示好,先把loading移除
            let loading = document.getElementById('loading');
            if(loading){
                loading.remove()
            };
            //上面的helper title
            let main_container = document.querySelector(".main-container");
            let helper_container = document.createElement("div");
            helper_container.classList.add('helper-title-container');
            let helper_title = document.createElement("div");
            helper_title.classList.add("helper-title");
            helper_title.appendChild(document.createTextNode("Health Helper"));
            helper_container.appendChild(helper_title);
            main_container.appendChild(helper_container);
            //下面的指示提示
            let message_panel =  document.createElement("div");
            message_panel.classList.add("message-panel");
            let display_message_section = document.createElement("div"); //先把display-message-section div弄好
            display_message_section.classList.add("display-message-section"); 
            //instruction按下後會不見
            let instruction = document.createElement("div");
            instruction.classList.add("helper-instruction");
            instruction.appendChild(document.createTextNode("Nice to see you! Click on any nutritionist to ask question about your diet."));
            display_message_section.appendChild(instruction);
            message_panel.appendChild(display_message_section);
            //訊息輸入
            let input_message_section = document.createElement("div");
            input_message_section.id="input-message-section";
            let input = document.createElement("input");
            input.setAttribute("type","text");
            input.setAttribute("id","message");
            input.setAttribute("placeholder"," Type message here...");
            input.setAttribute("autocomplete","off");
            let send_message_btn = document.createElement('div');
            send_message_btn.setAttribute("type","text");
            send_message_btn.id = "send_message";
            let send_img = document.createElement("i");
            send_img.setAttribute("data-feather","send");
            send_img.id="arrow";
            send_message_btn.appendChild(send_img);
            send_message_btn.addEventListener("click",function(){ //按下後傳送訊息給營養師
                let input_bar;
                if(on_which_nutri){
                    let receiver = on_which_nutri; //string
                    input_bar = document.getElementById("message")
                    let message = input_bar.value;
                    let jwt = localStorage.getItem("JWT");
                    if(message){
                        user_socket.emit("message_to_nutri",{"message":message,"receiver":receiver,"token":jwt});
                    };
                    //清空輸入框
                    input_bar.value="";
                }else{
                    input_bar.value="";
                }    
            });

            input.addEventListener("keypress",function(e){ //按下後傳送訊息給營養師
                if(e.key === "Enter"){
                    send_message_btn.click();
                }
            });    

            input.addEventListener("keydown",function(e){ 
                let jwt = localStorage.getItem("JWT");
                if(on_which_nutri){
                    if(e.key !== "Enter" && e.key !== "Backspace" && e.key!=="Shift" && e.key!=="Escape" && e.key!=="Tab"){
                        user_socket.emit("trigger_typing",{"token":jwt, "nutri_id": on_which_nutri});
                    }
                };
            });  


            input_message_section.appendChild(input);
            input_message_section.appendChild(send_message_btn);
            message_panel.appendChild(input_message_section);
            main_container.appendChild(message_panel);
            feather.replace();
            //要先註冊display-message-section往上滑動載入歷史訊息的事件
            display_message_section.addEventListener("scroll",function(){
                if(display_message_section.scrollTop === 0){
                    let oldest_time = nutritionist[on_which_nutri]["oldest_time"];
                    if(oldest_time && !scroll_lock){
                        lock = true;
                        scroll_lock = true;
                        get_read_message_with_nutri(oldest_time);
                    };
                }
            });                
            //使用者接收自己回傳的訊息,並顯示
            user_socket.on("show_self_message",function(data){
                // data = {"message":message,"time":message_time}
                let my_name = document.querySelector(".username").textContent;
                let message = data["message"];
                //要顯示的訊息時間格式
                let message_time_format = generate_msg_time_format(data["time"]);
                let message_box = create_message_box(my_name,message,message_time_format,data["time"]);
                let log_div = document.getElementById("log-"+on_which_nutri);
                log_div.appendChild(message_box);
                let display_message_section =document.querySelector(".display-message-section");
                display_message_section.scrollTop =  display_message_section.scrollHeight;
                //更新nutritionist裡的user_read,不用emit給後端更新,因為是使用者自己先傳訊息的,傳到server的時候就更新了
                nutritionist[String(on_which_nutri)]["user_read"] = data["time"];
            });    


            //使用者接收營養師傳來的訊息(因為使用者在線上才收到)    
            user_socket.on("show_nutri_message",function(data){
                //data = {"message":message,"time":message_time,"name":nutri_name,"nutri_id":nutri_id}
                //看on_which_nutri,如果有在該營養師,就顯示,如果沒有就顯示未讀
                if(on_which_nutri === String(data["nutri_id"])){ //直接顯示
                    let if_update_read_time = true;
                    let nutri_name = data["name"];
                    let message = data["message"];
                    let message_time = new Date(data["time"]);
                    let year = message_time.getFullYear(); //2022
                    let month = message_time.getMonth()  //4
                    let date = message_time.getDate();   //28
                    let hour = message_time.getHours();
                    let minute = message_time.getMinutes();
                    //要顯示的訊息時間格式
                    let message_time_format = String(year)+"/"+ String(month+1) + "/" + String(date) + " " + String(hour) + ":" + String(minute)
                    let message_box = create_message_box(nutri_name,message,message_time_format,data["time"]);
                    if(!lock){ //確認lock是false
                        if(data["time"] > nutritionist[String(data["nutri_id"])]["user_read"]){ //如果要顯示的訊息>目前的read時間,正常顯示
                            let log_div = document.getElementById("log-"+on_which_nutri);
                            log_div.appendChild(message_box);
                        }else{ //如果沒有(代表同時傳訊情況),要插到目前螢幕上最新的訊息前面顯示,且不用在更新已讀時間
                            //前一條訊息
                            let last_message_box = document.getElementById(String(nutritionist[String(data["nutri_id"])]["user_read"])).parentElement;
                            last_message_box.before(message_box);
                            console.log("置換成功");
                            if_update_read_time = false;
                        };
                        let display_message_section =document.querySelector(".display-message-section");
                        display_message_section.scrollTop =  display_message_section.scrollHeight;
                    }else{ //如果不是false就先存到buffer list
                        buffer_message_list.push(message_box);  
                        console.log("塞到buffer list囉");  
                    };
                    //把nutritionist裡的user_read更新,並且emit給後端更新
                    if(if_update_read_time){
                        nutritionist[String(data["nutri_id"])]["user_read"] = data["time"];
                        user_socket.emit("update_user_read",{
                                                                "nutri_id" : data["nutri_id"],
                                                                "time" : data["time"]
                                                            });
                    };
                }else{ //表示 使用者在其他營養師對話框
                    //先判斷nutritionist object有沒有這個營養師(一定有) 
                    nutritionist[String(data["nutri_id"])]["user_unread"] =  data["time"];
                    let user_div_span = document.getElementById(String(data["nutri_id"])).getElementsByClassName("nutri-name")[0];
                    if(! user_div_span.getElementsByClassName("unread")[0]){
                        let unread_img = document.createElement("i");
                        unread_img.setAttribute("data-feather","message-circle");
                        unread_img.classList.add("unread");
                        user_div_span.appendChild(unread_img); //新增未讀圖示
                        feather.replace();
                    };
                    //最後要emit到後端更新user_unread
                    user_socket.emit("update_user_unread",{
                                                            "nutri_id" : data["nutri_id"],
                                                            "time" : data["time"]
                                                            });
                };
            });   
            
            
            //更新營養師上線狀態
            user_socket.on("update_nutri_status",function(data){
                //data = {"nutri_id":str(current_nutri_id),"name":current_nutri_name}
                console.log('yoyo')
                if(nutritionist[data["nutri_id"]]){
                    console.log('yyy');
                    if(nutritionist[data["nutri_id"]]["status"] === 1){
                        nutritionist[data["nutri_id"]]["status"] = 0;
                        console.log('bbbbb');
                    }else{
                        nutritionist[data["nutri_id"]]["status"] = 1;
                        console.log('ccccc');
                    };
                    let nutri_div = document.getElementById(data["nutri_id"]);
                    console.log('zzzz')
                    let div = nutri_div.querySelector(".status-light");
                    div.classList.toggle("online");
                }else{ //代表有新營養師第一次上線
                    nutritionist[data["nutri_id"]]={
                        "name" : data["name"],
                        "status" : 1,
                        "user_read" : -1,
                        "user_unread" :-1
                    };
                    let nutri_div = render_nutri(data["nutri_id"],nutritionist[data["nutri_id"]]);
                    let status_container = document.querySelector(".status-container");
                    status_container.appendChild(nutri_div);   
                }
            });


            //接收來自其他分頁登出的事件,也要一併登出(刪除jwt)
            user_socket.on("sync_user_out",function(){
                localStorage.removeItem("JWT");
                window.location.reload();  
            });

            //使用者接收營養師正在typing事件  
            user_socket.on("show_typing",function(data){ //data={"nutri_name":nutri_name,"nutri_id":user_id }
                if(on_which_nutri === String(data["nutri_id"])){ //如果剛好在那個使用者就顯示xxx正在typing...
                    if(!nutritionist[on_which_nutri]["is_typing"]){
                        nutritionist[on_which_nutri]["is_typing"] = true;
                        let input_message_section = document.getElementById("input-message-section");
                        let dot_box = document.createElement("div");
                        dot_box.classList.add("dot-box");
                        let typing_content = document.createElement("div");
                        typing_content.classList.add("typing-content");
                        let span = document.createElement("span");
                        span.appendChild(document.createTextNode(data["nutri_name"]+" is typing "));
                        let dot = document.createElement("div");
                        dot.classList.add("dot-flashing");
                        typing_content.appendChild(span);
                        dot_box.appendChild(typing_content);
                        dot_box.appendChild(dot);
                        input_message_section.appendChild(dot_box);
                        //要設一個timer 
                        nutritionist[on_which_nutri]["is_typing_timer"] = setTimeout(function(){
                                                                    cancel_typing("user",on_which_nutri)},900)
                    }else if(nutritionist[on_which_nutri]["is_typing"] === true){
                        if(nutritionist[on_which_nutri]["is_typing_timer"]){
                            clearTimeout(nutritionist[on_which_nutri]["is_typing_timer"]);
                            nutritionist[on_which_nutri]["is_typing_timer"] = setTimeout(function(){
                                                                        cancel_typing("user",on_which_nutri)},900)
                        };
                    };
                };    
            });


        });

        user_socket.on("authentication_fail",function(){ //如果認證失敗,移除jwt
            console.log('jwt已失效');
            localStorage.removeItem("JWT");
            window.location.replace('/') //導回首頁        
        });

        user_socket.on("open_again",function(){ //又再開一次
            console.log('開過了');
            window.location.replace('/again') //導到警告頁面        
        });


    }else{  //如果是營養師
        nutri_socket  = io('/nutri',{auth: {token: jwt}});
        nutri_socket.on("authentication_pass",function(data){ //如果認證通過才要渲染出諮詢頁面
            let navmenu = document.querySelector(".navmenu");    
            render_user_profile(navmenu,data["nutri_data"]);  //5/15要再改成renderNutri
            //顯示使用者狀態
            let status_container = create_status_container();
            user = data["user_for_nutri"];  //使用者資訊
            if(user){
                for(let user_id in user){
                    let user_div = render_user(user_id,user[user_id])
                    status_container.appendChild(user_div);
                };
                navmenu.appendChild(status_container);
                feather.replace();
            };
            //把右邊顯示好,先把loading移除
            let loading = document.getElementById('loading');
            if(loading){
                loading.remove()
            };
            render_log_out(navmenu);
            //上面的helper title
            let main_container = document.querySelector(".main-container");
            let helper_container = document.createElement("div");
            helper_container.classList.add('helper-title-container');
            let helper_title = document.createElement("div");
            helper_title.classList.add("helper-title");
            helper_title.appendChild(document.createTextNode("Health Helper"));
            helper_container.appendChild(helper_title);
            main_container.appendChild(helper_container);
            //下面的指示提示
            let message_panel =  document.createElement("div");
            message_panel.classList.add("message-panel");
            let display_message_section = document.createElement("div"); //先把display-message-section div弄好
            display_message_section.classList.add("display-message-section"); 
            //instruction按下後會不見
            let instruction = document.createElement("div");
            instruction.classList.add("helper-instruction");
            instruction.appendChild(document.createTextNode("Start helping our user with your expertise! Click on any user who needs your help showing on the left bar."));
            display_message_section.appendChild(instruction);
            message_panel.appendChild(display_message_section);
            //訊息輸入
            let input_message_section = document.createElement("div");
            input_message_section.id="input-message-section";
            let input = document.createElement("input");
            input.setAttribute("type","text");
            input.setAttribute("id","message");
            input.setAttribute("placeholder","Type message here...");
            input.setAttribute("autocomplete","off");
            let send_message_btn = document.createElement('div');
            send_message_btn.setAttribute("type","text");
            send_message_btn.id = "send_message";
            let send_img  = document.createElement("i");
            send_img.setAttribute("data-feather","send");
            send_img.src="/picture/reply-arrow.png";
            send_img.id="arrow";
            send_message_btn.appendChild(send_img);
            send_message_btn.addEventListener("click",function(){ //按下後傳送訊息給使用者
                let input_bar;
                if(on_which_user){
                    let receiver = on_which_user; //string
                    input_bar = document.getElementById("message");
                    let message = input_bar.value;
                    let jwt = localStorage.getItem("JWT");
                    console.log('傳給使用者')   
                    if(message){
                        nutri_socket.emit("message_to_user",{"message":message,"receiver":receiver,"token":jwt});
                    };
                    //清空輸入框
                    input_bar.value="";
                }else{
                    input_bar.value="";
                }    
            });

            input.addEventListener("keypress",function(e){ //按下後傳送訊息給使用者
                if(e.key === "Enter"){
                    send_message_btn.click();
                }
            });

            input.addEventListener("keydown",function(e){ 
                let jwt = localStorage.getItem("JWT");
                if(on_which_user){
                    if(e.key !== "Enter" && e.key !== "Backspace" && e.key!=="Shift" && e.key!=="Escape" && e.key!=="Tab"){
                        nutri_socket.emit("trigger_typing",{"token":jwt, "user_id": on_which_user});
                    };
                };
            });

            input_message_section.appendChild(input);
            input_message_section.appendChild(send_message_btn);
            message_panel.appendChild(input_message_section);
            main_container.appendChild(message_panel);
            feather.replace();
            //要先註冊display-message-section往上滑動載入歷史訊息的事件
            display_message_section.addEventListener("scroll",function(){
                if(display_message_section.scrollTop === 0){
                    let oldest_time = user[on_which_user]["oldest_time"];
                    if(oldest_time && !scroll_lock){
                        lock = true;
                        scroll_lock = true;
                        get_read_message_with_user(oldest_time);
                    };
                }
            });
            //營養師接收使用者傳來的訊息(因為營養師在線上才收到)    
            nutri_socket.on("show_user_message",function(data){
                //data = {"message":message,"time":message_time,"name":user_name,"user_id":user_id}
                //看on_which_user,如果有在該使用者,就顯示,如果沒有就顯示未讀
                if(on_which_user === String(data["user_id"])){ //直接顯示
                    let if_update_read_time = true;
                    let user_name = data["name"];
                    let message = data["message"];
                    let message_time_format = generate_msg_time_format(data["time"]);
                    let message_box = create_message_box(user_name,message,message_time_format,data["time"]);
                    //前一條訊息
                    if(!lock){ //確認lock是false
                        if(data["time"] > user[String(data["user_id"])]["nutri_read"]){ //如果要顯示的訊息>目前的read時間,正常顯示
                            let log_div = document.getElementById("log-"+on_which_user);
                            log_div.appendChild(message_box);
                        }else{ //如果沒有(代表同時傳訊情況),要插到目前螢幕上最新的訊息前面顯示,且不用在更新已讀時間
                            //前一條訊息
                            let last_message_box = document.getElementById(String(user[on_which_user]["nutri_read"])).parentElement;
                            last_message_box.before(message_box);
                            console.log("置換成功");
                            if_update_read_time = false;
                        };
                        let display_message_section =document.querySelector(".display-message-section");
                        display_message_section.scrollTop =  display_message_section.scrollHeight;    
                    }else{ //如果不是false就先存到buffer list
                        buffer_message_list.push(message_box);    
                        console.log("塞到buffer list囉");
                    };
                    if(if_update_read_time){
                        //把user裡的nutri_read更新,並且emit給後端更新
                        user[String(data["user_id"])]["nutri_read"] = data["time"];
                        nutri_socket.emit("update_nutri_read",{
                                                                "user_id" : data["user_id"],
                                                                "time" : data["time"]
                                                            });
                    };
                }else{ //表示1. 營養師的user object沒有這個使用者(使用者是第一次傳給營養師) 2. 營養師在其他使用者對話框
                    //先判斷user object有沒有這個使用者
                    if(user[String(data["user_id"])]){ //表示 2 (user object已經有這個使用者了)
                        user[String(data["user_id"])]["nutri_unread"] =  data["time"];
                        let user_div_span = document.getElementById(String(data["user_id"])).getElementsByClassName("user-name")[0];
                        if(! user_div_span.getElementsByClassName("unread")[0]){
                            let unread_img = document.createElement("i");
                            unread_img.setAttribute("data-feather","message-circle");
                            unread_img.classList.add("unread");
                            user_div_span.appendChild(unread_img); //新增未讀圖示
                            feather.replace();
                        };
                    }else{ //表示 1 ,//要新增這個使用者到user object上,更新side bar
                        user[String(data["user_id"])] = {
                            "name" : data["name"],
                            "status" : 1,
                            "nutri_unread" : data["time"]};
                        let user_data = {"name":data["name"],"status":1,"nutri_unread":data["time"]};
                        let user_div = render_user(String(data["user_id"]),user_data);    
                        let status_container = document.querySelector(".status-container");
                        if(status_container.firstChild){
                            status_container.firstChild.before(user_div); //顯示在side bar第一個
                            feather.replace();
                        }else{
                            status_container.appendChild(user_div);
                            feather.replace();
                        };
                    };
                    //最後都要emit到後端更新nutri_unread
                    nutri_socket.emit("update_nutri_unread",{
                                                            "user_id" : data["user_id"],
                                                            "time" : data["time"]
                                                            });
                };
            });    

            //營養師接收自己回傳的訊息,並顯示
            nutri_socket.on("show_self_message",function(data){
                // data = {"message":message,"time":message_time}
                let my_name = document.querySelector(".username").textContent;
                let message = data["message"];
                //要顯示的訊息時間格式
                let message_time_format = generate_msg_time_format(data["time"]);
                let message_box = create_message_box(my_name,message,message_time_format,data["time"]);
                let log_div = document.getElementById("log-"+on_which_user);
                log_div.appendChild(message_box);
                let display_message_section =document.querySelector(".display-message-section");
                display_message_section.scrollTop =  display_message_section.scrollHeight; //滑到最下面
                //更新user裡的nuri_read,不用emit給後端更新,因為是營養師傳訊息,傳到server的時候就更新了
                user[String(on_which_user)]["nutri_read"] = data["time"];
            }); 

            nutri_socket.on("update_user_status",function(data){
                //data = {"user_id":str(current_user_id)}
                if(user[data["user_id"]]){ //如果這個上線的使用者有在營養師的side bar裡
                    if(user[data["user_id"]]["status"] === 1){
                        user[data["user_id"]]["status"] = 0;
                    }else{
                        user[data["user_id"]]["status"] = 1;
                    };
                    let user_div = document.getElementById(data["user_id"]);
                    let div = user_div.querySelector(".status-light");
                    div.classList.toggle("online");
                };
            });

            //接收來自其他分頁登出的事件,也要一併登出(刪除jwt)
            nutri_socket.on("sync_nutri_out",function(){
                localStorage.removeItem("JWT");
                window.location.reload();  
            });

            //營養師接收使用者正在typing事件  
            nutri_socket.on("show_typing",function(data){ //data={"user_name":user_name,"user_id":user_id }
                if(on_which_user === String(data["user_id"])){ //如果剛好在那個使用者就顯示xxx正在typing...
                    if(!user[on_which_user]["is_typing"]){
                        user[on_which_user]["is_typing"] = true;
                        let input_message_section = document.getElementById("input-message-section");
                        let dot_box = document.createElement("div");
                        dot_box.classList.add("dot-box");
                        let typing_content = document.createElement("div");
                        typing_content.classList.add("typing-content");
                        let span = document.createElement("span");
                        span.appendChild(document.createTextNode(data["user_name"]+" is typing "));
                        let dot = document.createElement("div");
                        dot.classList.add("dot-flashing");
                        typing_content.appendChild(span);
                        dot_box.appendChild(typing_content);
                        dot_box.appendChild(dot);
                        input_message_section.appendChild(dot_box);
                        //要設一個timer 
                        user[on_which_user]["is_typing_timer"] = setTimeout(function(){
                                                                    cancel_typing("nutri",on_which_user)},900)
                    }else if(user[on_which_user]["is_typing"] === true){
                        if(user[on_which_user]["is_typing_timer"]){
                            clearTimeout(user[on_which_user]["is_typing_timer"]);
                            user[on_which_user]["is_typing_timer"] = setTimeout(function(){
                                                                        cancel_typing("nutri",on_which_user)},900)
                        };
                    };
                };    
            });

        });   
        
        nutri_socket.on("authentication_fail",function(){ //如果認證失敗,移除jwt
            console.log('jwt已失效');
            localStorage.removeItem("JWT");
            window.location.replace('/') //導回首頁        
        });

        nutri_socket.on("open_again",function(){ //又再開一次
            console.log('開過了');
            window.location.replace('/again') //導到警告頁面        
        });

    }    


}

































