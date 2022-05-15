//for 營養師
let user;
 /*{"23":
    {
     name:xxx,
     status:0 or 1,
     user_read: -1,
     user_unread: 12345767   
    }       
}*/
let nutri_socket;
let on_which_user;
/*--------------------*/
// for 使用者
let nutritionist;
 /*{"23":
    {
     name:xxx,
     status:0 or 1,
     user_read: -1,
     user_unread: 12345767   
    }       
}*/
let user_socket;
let on_which_nutri;


//有一個鎖和buffer message list,用來處理塊未讀訊息時,同時有人傳訊息
let lock;
let buffer_message_list=[];





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
    status_photo_container.classList.add("status_photo_container");
    let status_img = new Image();
    status_img.src = "/picture/face.png";
    status_img.classList.add("status-photo");
    let div = document.createElement("div"); 
    if(nutri_data["status"]===1){
        div.classList.add("online");
    }else{
        div.classList.add("offline");
    };
    status_photo_container.appendChild(status_img);
    status_photo_container.appendChild(div);
    let span = document.createElement("span");
    span.classList.add("nutri-name");
    span.appendChild(document.createTextNode(nutri_data["name"]));
    if(nutri_data["user_unread"]>0){ //代表有最後一筆未讀的訊息時間,有未讀
        let unread_img = new Image();
        unread_img.src="/picture/unread.png";
        unread_img.classList.add("unread");
        span.appendChild(unread_img);
    }; 
    nutri_div.appendChild(status_photo_container);
    nutri_div.appendChild(span);
    nutri_div.addEventListener("click",function(){ //按下後產生與該營養師的對話
        if(on_which_nutri !== nutri_id){ //如果按下去不等於目前所在的營養師對話筐,才要換
            on_which_nutri = nutri_id;
            //看看有沒有user_read/unread in nutritionist
            if(nutritionist[nutri_id]["user_read"]===-1 && nutritionist[nutri_id]["user_unread"]===-1){
                console.log("與該營養師沒有對話紀錄");//代表與該營養師沒有對話過
            }else{ //代表與該營養師有對話過
                lock = false; //要先鎖起來,以免有人突然傳訊息過來
                let payload={"user_read":nutritionist[nutri_id]["user_read"],
                         "user_unread":nutritionist[nutri_id]["user_unread"],
                         "nutri_id":nutri_id
                        }
                get_message_with_nutri(JSON.stringify(payload)); //先打API要已(未讀)訊息,取完後不管有沒有未讀標誌都要拿掉
            };
            let display_message_section = document.querySelector("display-message-section");
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
    status_photo_container.classList.add("status_photo_container");
    let status_img = new Image();
    status_img.src = "/picture/face.png";
    status_img.classList.add("status-photo");
    let div = document.createElement("div"); 
    if(user_data["status"]===1){
        div.classList.add("online");
    }else{
        div.classList.add("offline");
    };
    status_photo_container.appendChild(status_img);
    status_photo_container.appendChild(div);
    let span = document.createElement("span");
    span.classList.add("user-name");
    span.appendChild(document.createTextNode(user_data["name"]));
    if(user_data["nutri_unread"]>0){ //代表有最後一筆未讀的訊息時間,有未讀
        let unread_img = new Image();
        unread_img.src="/picture/unread.png";
        unread_img.classList.add("unread");
        span.appendChild(unread_img);
    }; 
    user_div.appendChild(status_photo_container);
    user_div.appendChild(span);
    user_div.addEventListener("click",function(){  //按下後產生與該使用者的對話
        if(on_which_user !== user_id){ //如果按下去不等於目前所在的使用者對話筐,才要換
            on_which_user = user_id;
            //一定是與該使用者有對話過
            lock = false; //要先鎖起來,以免有人突然傳訊息過來
            let payload={"nutri_read":user[user_id]["nutri_read"],
                         "nutri_unread":user[user_id]["nutri_unread"],
                         "user_id":user_id
                        };
            get_message_with_user(JSON.stringify(payload)); //先打API要已(未讀)訊息,取完後不管有沒有未讀標誌都要拿掉
            let display_message_section = document.querySelector("display-message-section");
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








//認證通過後,進入helper頁面JWT認證通過才進行socket連線
function connect_socket(identity){
    let jwt = localStorage.getItem("JWT"); 
    if(identity === 1){ //如果是使用者
        user_socket  = io('http://127.0.0.1:3000/user',{auth: {token: jwt}});
        user_socket.on("authentication_pass",function(data){ //如果認證通過才要渲染出諮詢頁面
            let navmenu = document.querySelector(".navmenu");
            renderUser(navmenu,data["user_data"]); 
            //顯示營養師狀態
            let status_container = create_status_container();
            nutritionist = data["nutri_for_user"];  //營養師資訊
            for(let nutri_id in nutritionist){
                let nutri_div = render_nutri(nutri_id,nutritionist[nutri_id])
                status_container.appendChild(nutri_div);
            };
            navmenu.appendChild(status_container);
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
            input.setAttribute("placeholder","type here...");
            input.setAttribute("autocomplete","off");
            let send_message_btn = document.createElement('div');
            send_message_btn.setAttribute("type","text");
            send_message_btn.id = "send_message";
            let send_img  = new Image();
            send_img.src="/picture/reply-arrow.png";
            send_img.id="arrow";
            send_message_btn.appendChild(send_img);
            send_message_btn.addEventListener("click",function(){ //按下後傳送訊息給營養師
                let receiver = on_which_nutri; //string
                let input_bar = document.getElementById("message")
                let message = input_bar.value;
                let jwt = localStorage.getItem("JWT");
                user_socket.emit("message_to_nutri",{"message":message,"receiver":receiver,"token":jwt});
                //清空輸入框
                input_bar.value="";
            });
            input_message_section.appendChild(input);
            input_message_section.appendChild(send_message_btn);
            message_panel.appendChild(input_message_section);
            main_container.appendChild(message_panel);









        });
        user_socket.on("authentication_fail",function(){ //如果認證失敗,移除jwt
            console.log('jwt已失效');
            localStorage.removeItem("JWT");
            window.location.replace('/') //導回首頁        
        });
    }else{  //如果是營養師
        nutri_socket  = io('http://127.0.0.1:3000/nutri',{auth: {token: jwt}});
        nutri_socket.on("authentication_pass",function(data){ //如果認證通過才要渲染出諮詢頁面
            let navmenu = document.querySelector(".navmenu");    
            renderUser(navmenu,data["nutri_data"]);  //5/15要再改成renderNutri
            //顯示使用者狀態
            let status_container = create_status_container();
            user = data["user_for_nutri"];  //使用者資訊
            if(user){
                for(let user_id in user){
                    let user_div = render_user(user_id,user[user_id])
                    status_container.appendChild(user_div);
                };
                navmenu.appendChild(status_container);
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
            instruction.appendChild(document.createTextNode("Start helping our user with your expertise! Click on any user who needs your help showing on the left bar."));
            display_message_section.appendChild(instruction);
            message_panel.appendChild(display_message_section);
            //訊息輸入
            let input_message_section = document.createElement("div");
            input_message_section.id="input-message-section";
            let input = document.createElement("input");
            input.setAttribute("type","text");
            input.setAttribute("id","message");
            input.setAttribute("placeholder","type here...");
            input.setAttribute("autocomplete","off");
            let send_message_btn = document.createElement('div');
            send_message_btn.setAttribute("type","text");
            send_message_btn.id = "send_message";
            let send_img  = new Image();
            send_img.src="/picture/reply-arrow.png";
            send_img.id="arrow";
            send_message_btn.appendChild(send_img);
            send_message_btn.addEventListener("click",function(){ //按下後傳送訊息給使用者
                let receiver = on_which_user; //string
                let input_bar = document.getElementById("message");
                let message = input_bar.value;
                let jwt = localStorage.getItem("JWT");
                nutri_socket.emit("message_to_user",{"message":message,"receiver":receiver,"token":jwt});
                //清空輸入框
                input_bar.value="";
            });
            input_message_section.appendChild(input);
            input_message_section.appendChild(send_message_btn);
            message_panel.appendChild(input_message_section);
            main_container.appendChild(message_panel);





            




        });   
        
        


        nutri_socket.on("authentication_fail",function(){ //如果認證失敗,移除jwt
            console.log('jwt已失效');
            localStorage.removeItem("JWT");
            window.location.replace('/') //導回首頁        
        });


    }    


}

































