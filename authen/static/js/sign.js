let sign = {
    'signIn':{
        "box":"signinbox",
        "head_txt":"登入會員帳號",
        "mail_txt":"輸入電子信箱",
        "btn_txt":"登入帳戶",
        "destination":"tosignup",
        "msg":"還沒有帳戶?點此註冊"
    },
    'signUp':{
        "box":"signupbox",
        "head_txt":"註冊會員帳號",
        "mail_txt":"輸入電子郵件",
        "btn_txt":"註冊帳戶",
        "destination":"tosignin",
        "msg":"已經有帳戶?點此登入"
    }
};


//show登入註冊訊息
function showMessage(msg,flag,signup_result){
    if(flag){
        let button = document.getElementById("signbtn");
        let signin_content = document.querySelector(".content");
        let previous_message_div = document.querySelector(".message");
        if (previous_message_div){
            signin_content.removeChild(previous_message_div);
        };
        let fail_div  = document.createElement("div");
        fail_div.appendChild(document.createTextNode(msg));
        fail_div.classList.add('message');
        signin_content.style.height = "270px";
        button.after(fail_div);    
    }else{
        if(signup_result){
            let button = document.getElementById("signbtn");
            let signup_content = document.querySelector(".content");
            let previous_message_div = document.querySelector(".message");
            if (previous_message_div){
                signup_content.removeChild(previous_message_div);
            };
            let succeed_div  = document.createElement("div");
            succeed_div.appendChild(document.createTextNode(msg));
            succeed_div.classList.add('message');
            signup_content.style.height = "325px";
            button.after(succeed_div);
        }else{
            let button = document.getElementById("signbtn");
            let signup_content = document.querySelector(".content");
            let previous_message_div = document.querySelector(".message");
            if (previous_message_div){
                signup_content.removeChild(previous_message_div);
            };
            let fail_div  = document.createElement("div");
            fail_div.appendChild(document.createTextNode(msg));
            fail_div.classList.add('message');
            signup_content.style.height = "325px";
            button.after(fail_div);    
        }      
        
    }    
}





//框框互換
function switchBox(flag){ 
    let section2 = document.querySelector(".section-2")
    while(section2.firstElementChild){
        section2.removeChild(section2.firstElementChild)
    }
    //flag true代表有帳戶,false沒有帳戶
    if(flag){ 
        showBox(sign.signIn,true);
    }else{
        showBox(sign.signUp,false);
    }
};



//處理送出註冊資訊
async function sendAuthSignUp(data){
    try{
        let response = await fetch('/api/users/signup',{
                                     method: 'post',
                                     body: data,
                                     headers: { 'Content-Type': 'application/json'}
                                        });
        let result = await response.json();                                
        if(response.status === 201){ //201情況下
                showMessage("註冊成功，請登入",false,true);           
        }else if(response.status === 400){ //如果是400,有可能是1.email重複 2.註冊信箱或密碼格式錯誤
            showMessage(result.message,false,false);
            //清空信箱和密碼輸入框
            let mail_input = document.querySelector('.email');
            let pass_input = document.querySelector('.pass');
            mail_input.value='';
            pass_input.value=''; 
        }else if(response.status === 500){ //如果是500,代表伺服器(資料庫)內部錯誤
            showMessage(result.message,false,false);
        };
    }catch(message){
        console.log(`${message}`)
        throw Error('Fetching was not ok!!.')
    }    
}


//處理送出登入資訊
async function sendAuthSignIn(data){
    try{
        let response = await fetch('/api/users/signin',{
                                     method: 'post',
                                     body: data,
                                     headers: { 'Content-Type': 'application/json'}
                                        });
        let result = await response.json();                                
        if(response.ok){  //200情況下 
                //把登入成功得到的JWT 存在local storage,這邊要注意的是,fetch回來的response headers object
                //是iterable 物件,無法直接像plain object取得裡面的東西,要用迭代的方式取得
                let test = [];
                response.headers.forEach(function(o){test.push(o)});
                localStorage.setItem('JWT',test[0]);
                if(result["initial"] === true){ //表示是第一次登入,要轉到填寫資料畫面
                    window.location.href="/firsttime"
                }else{
                    window.location.href="/records"
                }
        }else if(response.status === 400){ //代表1.密碼錯誤2.沒有此信箱會員
                showMessage(result.message,true,null)
                //清空輸入框
                let mail_input = document.querySelector('.email');
                let pass_input = document.querySelector('.pass');
                mail_input.value='';
                pass_input.value=''; 
        }else if(response.status === 500){ //如果是500,代表伺服器(資料庫)內部錯誤
                showMessage(result.message,true,null)
        };
    }catch(message){
        console.log(`${message}`)
        throw Error('Fetching was not ok!!.')
    }    

}





//處理註冊事件
function handleSignUp(){
    let email = document.querySelector('.email').value;
    let password = document.querySelector('.pass').value;
    let name = document.querySelector('.name').value;
    let identity = document.getElementsByName('identity')[0].value;
    //先在前端驗證看看有沒有確實輸入或輸入正不正確
    if ((!name||!email) || (!password) || (!identity)){
        showMessage('請確實填寫註冊資訊欄位',false,false);
    }else{
        let emailRegex = /^(?!\.{1,2})(?![^\.]*\.{2})(?!.*\.{2}@)(?=[a-zA-Z0-9\.!#\$%&\'\*\+\/=?\^_{\|}~-]+@{1}(?:[A-Za-z\d]+\.{1})+[a-zA-Z]+$)(?!.*@{2,}).*/g;
        let passwordRegex = /^(?=\w{8,16}$)(?=(?:[^A-Z]*[A-Z]){3})(?=[^a-z]*[a-z])(?=[^\d]*\d).*/g;
        //檢查看格式正不正確
        if(emailRegex.test(email)&&passwordRegex.test(password)){
            if(Number(identity)===1){
                let signup_date = new Date();
                let year = signup_date.getFullYear();
                let month = signup_date.getMonth();
                let date = signup_date.getDate();
                let new_date = new Date(year,month-1,date);
                let now_utc =  Date.UTC(new_date.getUTCFullYear(), new_date.getUTCMonth(), new_date.getUTCDate(),0, 0, 0);
                let data = {  //註冊資訊
                    "name":name,
                    "email":email,
                    "password":password,
                    "signup_date":now_utc,
                    "identity":1
                }
                let req = JSON.stringify(data); //將註冊資料轉成json格式
                sendAuthSignUp(req);
            }else if (Number(identity)===2){
                let data = {  //註冊資訊
                    "name":name,
                    "email":email,
                    "password":password,
                    "identity":2
                }
                let req = JSON.stringify(data); //將註冊資料轉成json格式
                sendAuthSignUp(req);
            }    
        }else{
            let button = document.getElementById("signbtn");
            let signup_content = document.querySelector(".content");
            let previous_message_div = document.querySelector(".message");
            if (previous_message_div){
                signup_content.removeChild(previous_message_div);
            };
            let fail_div  = document.createElement("div");
            let span = document.createElement("span");
            span.appendChild(document.createTextNode("信箱或密碼輸入有誤。您的密碼必須包含:"));
            conditions=["八至十六個字元(僅限英文字母/數字)","至少三個大寫英文字母","至少一個小寫英文字母","至少一個阿拉伯數字"]
            condition_ul_tag = document.createElement("ul");
            condition_ul_tag.classList.add("condition");
            for(let i = 0;i<conditions.length;i++){
                let li = document.createElement("li");
                li.appendChild(document.createTextNode(conditions[i]));
                condition_ul_tag.appendChild(li);
            }; 
            fail_div.appendChild(span);
            fail_div.appendChild(condition_ul_tag);
            fail_div.classList.add('message');
            signup_content.style.height = "410px";
            button.after(fail_div);       
            //清空信箱和密碼輸入框
            let mail_input = document.querySelector('.email');
            let pass_input = document.querySelector('.pass');
            mail_input.value='';
            pass_input.value=''; 
        };
    };
}


//處理登入事件
function handleSignIn(){
    let email = document.querySelector('.email').value;
    let password = document.querySelector('.pass').value;
    let identity = document.getElementsByName('identity')[0].value;
    if (!email || !password || (identity==='0')){
        showMessage('請確實填寫登入資訊',true,null)
    }else{
        let data = {
            'email':email,
            'password':password,
            'identity':Number(identity)
        }
        let req = JSON.stringify(data); //轉成json格式
        sendAuthSignIn(req);
    }    

}

//處理登出事件
async function handleSignOut(){
    try{
        let response = await fetch('/api/users/signout',{method: 'delete'});
        let result = await response.json();                                
        if(response.ok){ //200情況下 
               console.log('登出成功') ;
               localStorage.removeItem('JWT');
               let identity = document.getElementById('user-email').getAttribute("identity")
               if(identity==="2"){
                   nutri_socket.emit("signout_disconnect");
               }else{
                   user_socket.emit("signout_disconnect");
               }
               window.location.replace('/');
        }
    }catch(message){
        console.log(`${message}`)
        throw Error('Fetching was not ok!!.')
    }    
}




//show出登入/註冊框
function showBox(obj,flag){//flag true代表有帳戶,false沒有帳戶
    let section2 = document.querySelector(".section-2")
    //主要框框
    let sign_box = document.createElement("div");
    sign_box.className=obj.box //"signinbox signupbox";
    //主要內容
    let sign_content = document.createElement("div");
    sign_content.className = "content";
      //看是登入還是註冊調整高度
    if(flag){
        sign_content.style.height="250px";
    }else{
        sign_content.style.height="307px";
    }
    //登入,註冊會員帳號＆x圖案
    let head = document.createElement("div");
    head.className = "head";
    let head_text = document.createTextNode(obj.head_txt);//"登入會員帳號"
    head.appendChild(head_text);
    sign_content.appendChild(head);

    //判斷是登入還是註冊(登入true,註冊false),如果是false要新增一欄"輸入姓名"
    if(!flag){
        let input_name = document.createElement("input");
        input_name.className = "name";
        input_name.setAttribute("placeholder","輸入姓名");
        input_name.setAttribute("type","text");
        sign_content.appendChild(input_name);
    }
    //信箱輸入框
    let input_mail = document.createElement("input");
    input_mail.className = "email";
    input_mail.setAttribute("placeholder",obj.mail_txt);
    input_mail.setAttribute("type","text");
    sign_content.appendChild(input_mail);
    //密碼輸入框
    let input_pass = document.createElement("input");
    input_pass.className = "pass";
    input_pass.setAttribute("placeholder","輸入密碼");
    input_pass.setAttribute("type","password");
    sign_content.appendChild(input_pass);
    //身份選擇匡
    let select = document.createElement("select");
    select.setAttribute("name",'identity');
    let option0 = document.createElement("option");
    option0.setAttribute("value",'0');
    option0.appendChild(document.createTextNode("Choose your identity"));
    let option1 = document.createElement("option");
    option1.setAttribute("value",'1');
    option1.appendChild(document.createTextNode("General user"))
    let option2 = document.createElement("option");
    option2.setAttribute("value",'2');
    option2.appendChild(document.createTextNode("Nutritionist"))
    select.appendChild(option0);
    select.appendChild(option1);
    select.appendChild(option2);
    sign_content.appendChild(select);
    //登入,註冊鈕
    let button = document.createElement("div");
    button.setAttribute("id","signbtn");   
    let button_text = document.createTextNode(obj.btn_txt);
    button.appendChild(button_text);
    //不管是登入或註冊鈕,在創造出來的時候,就要加上eventlistener,目的是送出ajax到後端驗證的路由
    if(flag){
        button.addEventListener('click',function(){handleSignIn()})
    }else{
        button.addEventListener('click',function(){handleSignUp()})
    };
    sign_content.appendChild(button);
    //還沒有帳戶or已經有帳戶？
    let goto = document.createElement("div");
    goto.className = obj.destination;
    let goto_text = document.createTextNode(obj.msg);
    goto.appendChild(goto_text);
     //按下去換框框
    goto.addEventListener("click",function(){
                          switchBox(!flag)
                        });
    sign_content.appendChild(goto);
    //將主內容放入框框裡
    sign_box.append(sign_content);
    section2.appendChild(sign_box)
}



async function sendJWT(jwt){
    try{
        let response = await fetch('/api/users',{
                                     method: 'get',
                                     headers: {"Authorization" : `Bearer ${jwt}`}
                                    });
        let result = await response.json();                         
        if(response.ok){
                // 進到首頁時,如果已登入過就轉到紀錄畫面
                if(window.location.pathname==='/'){
                    window.location.href='/record';
                }else if(window.location.pathname==='/records'){
                    // 4/24 這邊要動態render出records頁面

                    //右上角放小頭像
                    let login = document.querySelector('.login');
                    let img  = new Image();
                    img.src="/picture/member.png";
                    img.id = "signout";
                    img.addEventListener('click',function(){
                        let drop = document.getElementById('myDropdown');
                        drop.classList.toggle('show-dropdown');
                    });
                    login.appendChild(img);
                    //下拉選單
                    let dropdownBox = document.createElement('div');
                    dropdownBox.classList.add("dropdown-content");
                    dropdownBox.id="myDropdown";
                    let mailBox = document.createElement('div');
                    mailBox.id = "user-email";
                    mailBox.setAttribute("user-name",result.data.name);//把使用者姓名種在屬性裡
                    mailBox.setAttribute("identity",result.data.identity); //把使用者身份種在屬性裡
                    mailBox.appendChild(document.createTextNode(`${result.data.email}`));
                    let logoutBtn = document.createElement('div');
                    logoutBtn.id="logout";
                    logoutBtn.appendChild(document.createTextNode("登出"));
                    logoutBtn.addEventListener('click',handleSignOut);
                    dropdownBox.appendChild(mailBox);
                    dropdownBox.appendChild(logoutBtn);
                    login.appendChild(dropdownBox);
                    console.log('準備連socket')
                    
                    socket_connect();
                }else if(window.location.pathname==='/chat'){
                    //這邊做動態render諮詢頁面
                }
        }else{
            console.log('jwt已失效');
            localStorage.removeItem("JWT");
            window.location.replace('/') //導回首頁
        };
    }catch(message){
        console.log(`${message}`)
        throw Error('Fetching was not ok!!.')
    }    
} 







function init_sign(){
    let jwt = localStorage.getItem("JWT");
    if(jwt){ //如果已經有jwt,加在header上送出request
        sendJWT(jwt);
    }else if (window.location.pathname ==='/'){
        let goto_signup = document.querySelector(".tosignup");
        goto_signup.addEventListener("click",()=>{
            switchBox(false)
        });    
        let signin_button = document.getElementById("signbtn");
        signin_button.addEventListener("click",function(){handleSignIn()});
    }else{
       window.location.replace('/');
    }
}    


window.addEventListener('load',init_sign);

