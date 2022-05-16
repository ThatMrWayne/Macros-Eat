let sign = {
    'signIn':{
        "box":"signinbox",
        "head_txt":"Log in",
        "mail_txt":"email",
        "btn_txt":"Log in",
        "destination":"tosignup",
        "msg":"Not a member? Sign up."
    },
    'signUp':{
        "box":"signupbox",
        "head_txt":"Create your account",
        "mail_txt":"email",
        "btn_txt":"Create account",
        "destination":"tosignin",
        "msg":"Already a member? Sign in."
    }
};


//動態顯示填資料表格
function render_fillin(){
    //先移掉登入註冊匡
    let section2 = document.querySelector(".section-2");
    document.body.removeChild(section2);

    //<div class='basic-information'>
    let basic_information = document.createElement("div");
    basic_information.classList.add("basic-information");
    //<div id="welcome">
    let welcome = document.createElement("div");
    welcome.setAttribute("id","welcome");
    const welcome_word1 = "Welcome！"
    const mybr = document.createElement('br');
    const welcome_word2 = "Please fill in personal information, we'll provide recommended diet plan for you later~"
    welcome.appendChild(document.createTextNode(welcome_word1));
    welcome.appendChild(mybr);
    welcome.appendChild(document.createTextNode(welcome_word2));
    basic_information.appendChild(welcome);
    //<div class="form-box">
    let form_box = document.createElement("div");
    form_box.classList.add("form-box");
    //<form class="form">
    let form = document.createElement("form");
    form.classList.add("form");
    //<div class="choose-gender">
    let choose_gender = document.createElement("div");
    choose_gender.classList.add("choose-gender");
    let gender = document.createElement("span");
    gender.classList.add("describe");
    gender.classList.add("gender");
    gender.appendChild(document.createTextNode("Gender :"));
    //<input id="male" type="radio" name="gender" value="1" checked>
    let male = document.createElement("input");
    male.setAttribute("id","male");
    male.setAttribute("type","radio");
    male.setAttribute("name","gender");
    male.setAttribute("value","1");
    male.checked=true;
    //<label for="male">male</label>
    let label_male = document.createElement("label");
    label_male.setAttribute("for","male");
    label_male.appendChild(document.createTextNode("male"));
    //<input id="female" type="radio" name="gender" value="0">
    let female = document.createElement("input");
    female.setAttribute("id","female");
    female.setAttribute("type","radio");
    female.setAttribute("name","gender");
    female.setAttribute("value","0");
    //<label for="female">female</label>
    let label_female = document.createElement("label");
    label_female.setAttribute("for","female");
    label_female.appendChild(document.createTextNode("female"));
    choose_gender.appendChild(gender);
    choose_gender.appendChild(male);
    choose_gender.appendChild(label_male);
    choose_gender.appendChild(female);
    choose_gender.appendChild(label_female);
    form.appendChild(choose_gender);
    //<div class="choose-age">
    let choose_age = document.createElement("div");
    choose_age.classList.add("choose-age");
    let age = document.createElement("span");
    age.classList.add("describe");
    age.classList.add("age");
    age.appendChild(document.createTextNode("Age :"));
    //<input id="age"  name="age" type="text" placeholder="Age" inputmode="decimal"></input>
    let age_input = document.createElement("input");
    age_input.setAttribute("id","age");
    age_input.setAttribute("type","text");
    age_input.setAttribute("name","age");
    age_input.setAttribute("placeholder","Age");
    choose_age.appendChild(age);
    choose_age.appendChild(age_input);
    form.appendChild(choose_age);
    //<div class="choose-height">
    let choose_height = document.createElement("div");
    choose_height.classList.add("choose-height");
    let height = document.createElement("span");
    height.classList.add("describe");
    height.classList.add("height");
    height.appendChild(document.createTextNode("Height :"));
    //<input id="height"  name="height" type="text" placeholder="Height (cm)" inputmode="decimal">
    let height_input = document.createElement("input");
    height_input.setAttribute("id","height");
    height_input.setAttribute("type","text");
    height_input.setAttribute("name","height");
    height_input.setAttribute("placeholder","Height (cm)");
    choose_height.appendChild(height);
    choose_height.appendChild(height_input);
    form.appendChild(choose_height);
    //<div class="choose-weight">
    let choose_weight = document.createElement("div");
    choose_weight.classList.add("choose-weight");
    let weight = document.createElement("span");
    weight.classList.add("describe");
    weight.classList.add("weight");
    weight.appendChild(document.createTextNode("Weight :"));
    //<input id="weight"  name="weight" type="text" placeholder="Weight (kg)" inputmode="decimal">
    let weight_input = document.createElement("input");
    weight_input.setAttribute("id","weight");
    weight_input.setAttribute("type","text");
    weight_input.setAttribute("name","weight");
    weight_input.setAttribute("placeholder","Weight (kg)");
    choose_weight.appendChild(weight);
    choose_weight.appendChild(weight_input);
    form.appendChild(choose_weight);
    //<div class="choose-activity">
    let choose_activity = document.createElement("div");
    choose_activity.classList.add("choose-activity");
    //<h3 class="describe">Activity Level :</h3>
    let activity_level = document.createElement("h3");
    activity_level.classList.add("describe");
    activity_level.appendChild(document.createTextNode("Activity Level :"));
    //<div id="zero">
    let zero = document.createElement("div");
    zero.setAttribute("id","zero");
    let level1_input = document.createElement("input");
    level1_input.setAttribute("id","level1");
    level1_input.setAttribute("type","radio");
    level1_input.setAttribute("name","habit");
    level1_input.setAttribute("value","1");
    level1_input.checked=true;
    let label_level1 = document.createElement("label");
    label_level1.setAttribute("for","level1");
    label_level1.appendChild(document.createTextNode("sedentary (little/no exercise)"));
    zero.appendChild(level1_input);
    zero.appendChild(label_level1);
    //<div id="light">
    let light = document.createElement("div");
    light.setAttribute("id","light");
    let level2_input = document.createElement("input");
    level2_input.setAttribute("id","level2");
    level2_input.setAttribute("type","radio");
    level2_input.setAttribute("name","habit");
    level2_input.setAttribute("value","2");
    let label_level2 = document.createElement("label");
    label_level2.setAttribute("for","level2");
    label_level2.appendChild(document.createTextNode("light activity (exercise 1~2 times/week)"));
    light.appendChild(level2_input);
    light.appendChild(label_level2);
    //<div id="moderate">
    let moderate = document.createElement("div");
    moderate.setAttribute("id","moderate");
    let level3_input = document.createElement("input");
    level3_input.setAttribute("id","level3");
    level3_input.setAttribute("type","radio");
    level3_input.setAttribute("name","habit");
    level3_input.setAttribute("value","3");
    let label_level3 = document.createElement("label");
    label_level3.setAttribute("for","level3");
    label_level3.appendChild(document.createTextNode("(exercise 3~4 times/week)"));
    moderate.appendChild(level3_input);
    moderate.appendChild(label_level3);
    //<div id="heavy">
    let heavy = document.createElement("div");
    heavy.setAttribute("id","heavy");
    let level4_input = document.createElement("input");
    level4_input.setAttribute("id","level4");
    level4_input.setAttribute("type","radio");
    level4_input.setAttribute("name","habit");
    level4_input.setAttribute("value","4");
    let label_level4 = document.createElement("label");
    label_level4.setAttribute("for","level4");
    label_level4.appendChild(document.createTextNode("very activate (exercise >5 times/week)"));
    heavy.appendChild(level4_input);
    heavy.appendChild(label_level4);

    choose_activity.appendChild(activity_level);
    choose_activity.appendChild(zero);
    choose_activity.appendChild(light);
    choose_activity.appendChild(moderate);
    choose_activity.appendChild(heavy);
    form.appendChild(choose_activity);

    //<div class="choose-target">
    let choose_target = document.createElement("div");
    choose_target.classList.add("choose-target");
    //<span class="describe target">Target :</span>
    let target = document.createElement("span");
    target.classList.add("describe");
    target.classList.add("target");
    target.appendChild(document.createTextNode("Target :"));
    //<input id="lose" type="radio" name="target" value="1">
    let lose_input = document.createElement("input");
    lose_input.setAttribute("id","lose");
    lose_input.setAttribute("type","radio");
    lose_input.setAttribute("name","target");
    lose_input.setAttribute("value","1");
    let label_lose = document.createElement("label");
    label_lose.setAttribute("for","lose");
    label_lose.appendChild(document.createTextNode("Lose weight"));
    //<input id="maintain" type="radio" name="target" value="2" checked>
    let maintain_input = document.createElement("input");
    maintain_input.setAttribute("id","maintain");
    maintain_input.setAttribute("type","radio");
    maintain_input.setAttribute("name","target");
    maintain_input.setAttribute("value","2");
    maintain_input.checked=true;
    let label_maintain = document.createElement("label");
    label_maintain.setAttribute("for","maintain");
    label_maintain.appendChild(document.createTextNode("Maintain"));
    //<input id="gain" type="radio" name="target" value="3">
    let gain_input = document.createElement("input");
    gain_input.setAttribute("id","gain");
    gain_input.setAttribute("type","radio");
    gain_input.setAttribute("name","target");
    gain_input.setAttribute("value","3");
    let label_gain = document.createElement("label");
    label_gain.setAttribute("for","gain");
    label_gain.appendChild(document.createTextNode("Gain weight"));

    choose_target.appendChild(target);
    choose_target.appendChild(lose_input);
    choose_target.appendChild(label_lose);
    choose_target.appendChild(maintain_input);
    choose_target.appendChild(label_maintain);
    choose_target.appendChild(gain_input);
    choose_target.appendChild(label_gain);
    form.appendChild(choose_target);
    //<div class="submit">Calculate</div>
    let submit = document.createElement("div");
    submit.classList.add("submit");
    submit.appendChild(document.createTextNode("Calculate"));
    //註冊按下calculate鈕事件
    submit.addEventListener("click",()=>{
        //先檢查表單資料都對不對&有沒有填
        let validate = validate_form();
        if(validate){
            let jwt = localStorage.getItem("JWT");
            let json_data = organize_form();
            submit_information(json_data,jwt);
        }        
    });
    form.appendChild(submit);
    //
    form_box.appendChild(form);
    basic_information.appendChild(form_box);
    //最後把basci-inofrmation放在section1後面
    let section1 = document.querySelector(".section-1");
    section1.after(basic_information);
}








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
                if(result["initial"] === true){ //表示是第一次登入,動態render填寫資料頁面
                    render_fillin();
                }else{ //表示不是第一次登入
                    window.location.href="/record"
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
        showMessage('Please fill in valid information',false,false);
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
                let new_date = new Date(year,month,date);
                let now_utc =  Date.UTC(new_date.getUTCFullYear(), new_date.getUTCMonth(), new_date.getUTCDate(),new_date.getUTCHours(), new_date.getUTCMinutes(), new_date.getUTCSeconds());
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
        showMessage('Please fill in valid information',true,null)
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
        input_name.setAttribute("placeholder","username");
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
    input_pass.setAttribute("placeholder","password");
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
        console.log(result);                
        if(response.ok && result.data["identity"]===1 && result.data["initial"]===0){
                // 進到首頁時,如果已登入過就轉到紀錄畫面
                if(window.location.pathname==='/'){
                    window.location.href='/record';
                }else if(window.location.pathname==='/record'){
                    //  4/24 這邊要動態render出records頁面
                    //window.setTimeout(function(){render_record()},5000);
                    render_record(result.data);
                }else if(window.location.pathname==='/helper'){
                    console.log("幹幹叫")
                    connect_socket(1);
                }
        }else if(response.ok && result.data["identity"]===1 && result.data["initial"]===1){ //代表登入後就跳跳掉沒有填表單
            if(window.location.pathname==='/'){
                render_fillin() //顯示表單給他填;
            }else{
                window.location.replace('/') //導回首頁
            };    
        }else if(response.ok && result.data["identity"]===2){ //代表是營養師,直接導到諮詢頁面
            if(window.location.pathname==='/helper'){
                connect_socket(2);
            }else{
                window.location.href="/helper";
            }
        }else{
            console.log('jwt已失效');
            localStorage.removeItem("JWT");
            window.location.replace('/') //導回首頁
        };  
    }catch(message){
        console.log(`${message}`)
        throw Error('Fetching was not ok!!.')
    };    
}; 




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
