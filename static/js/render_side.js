let my_food_page = 0;
let can_get_my_food = true; 



/* 會員頁部分 */

async function get_member_data(){  

};

function render_member_page(){

};

/* whph60308*/ 

function render_user_profile(navmenu,user_data){
    let user_profile = document.createElement("div");
    user_profile.classList.add("user-profile");
    let img = new Image();
    img.src = "/picture/face.png";
    img.classList.add("profile_picture");
    let span = document.createElement("span");
    span.classList.add("username");
    span.setAttribute("id",user_data["member_id"]);
    span.appendChild(document.createTextNode(user_data["name"]));
    span.addEventListener("click",function(){ //按下後跑去會員頁面
        render_member_page(); //
    });
    user_profile.appendChild(img);
    user_profile.appendChild(span);
    navmenu.appendChild(user_profile);
};


/* 我的食物部分 */


async function get_my_food(food_page){ //get_my_food成功後才render_my_food
    let jwt = localStorage.getItem("JWT");
    try{
        let response = await fetch('/api/my-food?page='+food_page,{ //初始page是0
                                                    method: 'get',
                                                    headers: {"Authorization" : `Bearer ${jwt}`}
                                                });
        let result = await response.json();                                
        if(response.ok){  //200情況下 
            console.log(result);
            //插到myfood顯示匡tbody內
            let tbody = document.querySelector(".my-food-body");
            let food = result["data"];
            if(food.length!==0){
                for(let i=0;i<food.length;i++){
                    let tr = create_my_tr(food[i]);
                    tbody.appendChild(tr);
                };
            }    
            let next_page = result["nextPage"];
            my_food_page = next_page;    
            can_get_my_food = true;      
        }else if(response.status === 400){ //
                
        }else if(response.status === 500){ //如果是500,代表伺服器(資料庫)內部錯誤
                
        };
    }catch(message){
        console.log(`${message}`)
        throw Error('Fetching was not ok!!.')
    }; 

};


//刪除我的食物
async function delete_my_food(food_id){
    let jwt = localStorage.getItem("JWT");
    try{
        let response = await fetch('/api/my-food?food_id='+food_id,{
                                                    method: 'delete',
                                                    headers: {"Authorization" : `Bearer ${jwt}`}
                                                });                               
        if(response.status===204){  //204 刪除我的食物成功
            //新增我的食物成功,直接重新打一次get_my_food,把my_food_page歸0,先把tbody清空
            let tbody = document.querySelector(".my-food-body");
            while(tbody.firstChild){
                tbody.firstChild.remove(); 
            };
            my_food_page = 0;
            get_my_food(my_food_page);      
        }else if(response.status === 400){ //刪除失敗,該食物不存在或不屬於此會員
            console.log("刪除失敗");
        }else if(response.status === 403){ //
            console.log("JWT失效,拒絕存取");
            localStorage.removeItem("JWT");
            window.location.replace("/"); //導回首頁,重新登入;
        }else if(response.status === 500){ //如果是500,代表伺服器(資料庫)內部錯誤
                console.log("伺服器錯誤");
        };
    }catch(message){
        console.log(`${message}`)
        throw Error('Fetching was not ok!!.')
    };
};




//我的食物tr 
function create_my_tr(food){
    let tr = document.createElement("tr");
    tr.classList.add("food-item");
    let th = document.createElement("th");
    th.classList.add("food-name");
    th.appendChild(document.createTextNode(String(food["food_name"])));
    let td_p = document.createElement("td");
    td_p.classList.add("p");
    td_p.appendChild(document.createTextNode(String(food["protein"])));
    let td_f = document.createElement("td");
    td_f.classList.add("f");
    td_f.appendChild(document.createTextNode(String(food["fat"])));
    let td_c = document.createElement("td");
    td_c.classList.add("c");
    td_c.appendChild(document.createTextNode(String(food["carbs"])));
    let td_delete = document.createElement("td");
    td_delete.classList.add("delete");
    td_delete.setAttribute("id",food["food_id"]); //把food_id直接放在垃圾桶
    let delete_icon = new Image();
    delete_icon.src = "/picture/icon_delete.png";
    td_delete.addEventListener("click",function(){ //註冊刪除飲食紀錄
        can_get_my_food = false; //按下去的時候要先變false
        delete_my_food(this.id);
    });
    td_delete.appendChild(delete_icon);
    tr.appendChild(th);
    tr.appendChild(td_p);
    tr.appendChild(td_f);
    tr.appendChild(td_c);
    tr.appendChild(td_delete);
    return tr
};



async function add_food(payload,jwt){ //新增食物API
    try{
        let response = await fetch('/api/my-food',{
                                     method: 'post',
                                     body : payload,
                                     headers: {"Authorization" : `Bearer ${jwt}`,'Content-Type': 'application/json'}
                                    });
        let result = await response.json();                            
        if(response.status === 201){ //新增我的食物完成
            //新增完成,插到我的食物table
            console.log(result);
            let payload_obj = JSON.parse(payload);
            console.log(payload_obj);
            //新增我的食物成功,直接重新打一次get_my_food,把my_food_page歸0,先把tbody清空
            let tbody = document.querySelector(".my-food-body");
            while(tbody.firstChild){
                tbody.firstChild.remove(); 
            };
            my_food_page = 0;
            get_my_food(my_food_page);
            //把新增食物匡清空,提示訊息清空
            let food_name = document.getElementById("new-food-name");
            let protein = document.getElementById("new-food-protein");
            let fat = document.getElementById("new-food-fat");
            let carbs = document.getElementById("new-food-carb");
            food_name.value="";
            protein.value="";
            fat.value="";
            carbs.value="";
            let tip = document.querySelector(".tip");
            if(tip){
                tip.remove()
            };
        }else if (response.status === 403){
            console.log('JWT已失效,請重新登入');
            localStorage.removeItem("JWT");
            window.location.href = '/';
        }else if (response.status === 400){
            console.log(result);
        }else{
            console.log('伺服器錯誤');
        }
    }catch(message){
        console.log(`${message}`)
        throw Error('Fetching was not ok!!.')
    };  
};    



//驗證新增食物資料
function validate_new_food(){
    let food_name = document.getElementById("new-food-name");
    let protein = document.getElementById("new-food-protein");
    let fat = document.getElementById("new-food-fat");
    let carbs = document.getElementById("new-food-carb");
    let result = true;
    if(!food_name.value){
        show_tip('Enter a food name','.food-mark');
        result = false;
        return result;
    }else if(!protein.value || Number(protein.value)<0){
        show_tip('Enter a valid value','.protein-title');
        result = false;
        return result;
    }else if(!fat.value || Number(fat.value)<0){
        show_tip('Enter a valid value','.fat-title');
        result = false;
        return result;
    }else if(!carbs.value || Number(carbs.value)<0){
        show_tip('Enter a valid value','.carb-title');
        result = false;
        return result;
    }
    return result    
};



//組織新增食物資料  打/my-food POST
function organize_new_food(){
    let formdata = new FormData(document.querySelector('.add-food-form'));
    let data={}
    for(let pair of formdata.entries()){
        if(pair[0]==='input-food-name'){
            let n = pair[1];
            data["food_name"]=n;
        }else if(pair[0]==='input-food-p'){
            let n  = Number(Number(pair[1]).toFixed(1));
            data["protein"]=n;
        }else if(pair[0]==='input-food-f'){
            let n  = Number(Number(pair[1]).toFixed(1));
            data["fat"]=n;
        }else if(pair[0]==='input-food-c'){
            let n  = Number(Number(pair[1]).toFixed(1));
            data["carbs"]=n;
        }
    };
    console.log(data);
    return JSON.stringify(data)
}




//pop out出食物顯示匡
function render_my_food_window(background){
    let my_food_box = document.createElement("div");
    my_food_box.classList.add("my-food-box");
    //先裝left的我的食物清單
    let show_my_food = document.createElement("div");
    show_my_food.classList.add("show-my-food");
    let table = document.createElement("table");
    table.classList.add("my-food-table");
    let thead = document.createElement("thead");
    let tr = document.createElement("tr");
    let th_text = ["Food name","Protein(g)","Fat(g)","Carbs(g)","\u00A0"]
    for(let i=0;i<th_text.length;i++){
        let th = document.createElement("th");
        th.classList.add("head");
        th.appendChild(document.createTextNode(th_text[i]));
        tr.appendChild(th);
    };
    thead.appendChild(tr);
    table.appendChild(thead);
    let tbody = document.createElement("tbody");
    tbody.classList.add("my-food-body");
    get_my_food(my_food_page) //取得食物資料
    show_my_food.addEventListener("scroll",function(){ //my-food table註冊滑動載入my-food事件
        if(this.scrollHeight-this.scrollTop <= this.clientHeight){
            if(can_get_my_food && my_food_page){
                can_get_my_food = false;
                get_my_food(my_food_page);
            };
        };
    });
    table.appendChild(tbody);
    show_my_food.appendChild(table);
    my_food_box.appendChild(show_my_food);
    //在裝right的新增我的食物
    let add_food_div = document.createElement("div");
    add_food_div.classList.add("add-food");
    let add_food_form = document.createElement("form");
    add_food_form.classList.add("add-food-form");
    //小title
    let title_div = document.createElement("div");
    title_div.classList.add("add-food-title");
    title_div.innerHTML = "Add self-defined food";
    //填入食物名稱(必填)
    let fill_food_name = document.createElement("div");
    fill_food_name.classList.add("fill-food-name");
    fill_food_name.classList.add("fill");
    let span1 = document.createElement("span");
    span1.classList.add("food-mark");
    span1.classList.add("add-title");
    span1.innerHTML = "Food Name :";
    let input_food_name = document.createElement("input");
    input_food_name.setAttribute("id","new-food-name");
    input_food_name.setAttribute("type","text");
    input_food_name.setAttribute("name","input-food-name");
    fill_food_name.appendChild(span1);
    fill_food_name.appendChild(input_food_name);
    //分隔線
    let break_div = document.createElement("div");
    break_div.classList.add("break");
    //提示語
    let remider_div = document.createElement("div");
    remider_div.classList.add("add-remind");
    remider_div.innerHTML = "Food macros (per 100g food)";
    //填入蛋白質
    let fill_protein = document.createElement("div");
    fill_protein.classList.add("fill-protein");
    fill_protein.classList.add("fill");
    let span2 = document.createElement("span");
    span2.classList.add("add-title");
    span2.classList.add("protein-title");
    span2.innerHTML = "Protein :";
    let input_p = document.createElement("input");
    input_p.setAttribute("id","new-food-protein");
    input_p.setAttribute("type","number");
    input_p.setAttribute("step","0.1");
    input_p.setAttribute("min","0");
    input_p.setAttribute("name","input-food-p");
    let span2_1 = document.createElement("span");
    span2_1.innerHTML="g";
    fill_protein.appendChild(span2);
    fill_protein.appendChild(input_p);
    fill_protein.appendChild(span2_1);
    //填入脂肪
    let fill_fat = document.createElement("div");
    fill_fat.classList.add("fill-fat");
    fill_fat.classList.add("fill");
    let span3 = document.createElement("span");
    span3.classList.add("add-title");
    span3.classList.add("fat-title");
    span3.innerHTML = "Fat :";
    let input_f = document.createElement("input");
    input_f.setAttribute("id","new-food-fat");
    input_f.setAttribute("type","number");
    input_f.setAttribute("step","0.1");
    input_f.setAttribute("min","0");
    input_f.setAttribute("name","input-food-f");
    let span3_1 = document.createElement("span");
    span3_1.innerHTML="g";
    fill_fat.appendChild(span3);
    fill_fat.appendChild(input_f);
    fill_fat.appendChild(span3_1);
    //填入碳水
    let fill_carbs = document.createElement("div");
    fill_carbs.classList.add("fill-carbs");
    fill_carbs.classList.add("fill");
    let span4 = document.createElement("span");
    span4.classList.add("add-title");
    span4.classList.add("carb-title");
    span4.innerHTML = "Carbs :";
    let input_c = document.createElement("input");
    input_c.setAttribute("id","new-food-carb");
    input_c.setAttribute("type","number");
    input_c.setAttribute("step","0.1");
    input_c.setAttribute("min","0");
    input_c.setAttribute("name","input-food-c");
    let span4_1 = document.createElement("span");
    span4_1.innerHTML="g";
    fill_carbs.appendChild(span4);
    fill_carbs.appendChild(input_c);
    fill_carbs.appendChild(span4_1);
    //按鈕
    let btn_div = document.createElement("div");
    btn_div.classList.add("add-food-btn");
    let submit_btn = document.createElement("span");
    submit_btn.classList.add("submit-add-food");
    submit_btn.innerHTML = "Save change";
    submit_btn.addEventListener("click",function(){ //註冊新增我的食物事件
        //送出新增的食物資料前先檢查有沒有都填了＆資料正不正確
        let validate = validate_new_food();
        if(validate){
            can_get_my_food = false; //按下去的時候要先變false
            console.log("ok");
            let jwt = localStorage.getItem("JWT");
            let json_data = organize_new_food();
            add_food(json_data,jwt);
        };        
    });
    let close_btn = document.createElement("span");
    close_btn.classList.add("close-add");
    close_btn.innerHTML = "Close";
    close_btn.addEventListener("click",function(){ //關掉更新window
        //關掉框框
        document.body.classList.toggle("stop-scrolling");
        let bg = document.getElementsByClassName('bg');
        document.body.removeChild(bg[0]);
        my_food_page = 0; //頁面歸零
        can_get_my_food = true;
    });
    btn_div.appendChild(close_btn);
    btn_div.appendChild(submit_btn);
    //最後
    add_food_form.appendChild(title_div);
    add_food_form.appendChild(fill_food_name);
    add_food_form.appendChild(break_div)
    add_food_form.appendChild(remider_div);
    add_food_form.appendChild(fill_protein);
    add_food_form.appendChild(fill_fat);
    add_food_form.appendChild(fill_carbs);
    add_food_form.appendChild(btn_div);
    add_food_div.appendChild(add_food_form);
    my_food_box.appendChild(add_food_div);
    background.appendChild(my_food_box);
    return background;
};



/* My Food */

function render_my_food(navmenu){
    let personal_food = document.createElement("div");
    personal_food.classList.add("nav-page");
    personal_food.classList.add("personal-food");
    let span = document.createElement("span");
    span.setAttribute("id","myfood");
    span.appendChild(document.createTextNode("My Food"));
    span.addEventListener("click",function(){ //按下後產生我的食物
        let bg = render_my_food_window(createBack());
        document.body.appendChild(bg);
    });
    personal_food.appendChild(span);
    navmenu.appendChild(personal_food);
}


/* 我的飲食計畫部分 */


//刪除飲食計畫
async function delete_plan(plan_id){
    let jwt = localStorage.getItem("JWT");
    try{
        let response = await fetch('/api/plans?plan_id='+plan_id,{
                                                    method: 'delete',
                                                    headers: {"Authorization" : `Bearer ${jwt}`}
                                                });                               
        if(response.status===204){  //204 刪除我的計畫成功
            //從我的飲食計畫table移除 ,也是一樣要重新get_diet_plan
            let tbody = document.querySelector(".plan-body");
            while(tbody.firstChild){
                tbody.firstChild.remove(); 
            };    
            my_plan_page = 0;
            get_diet_plan(my_plan_page,"foredit");
        }else if(response.status === 400){ //刪除失敗,日飲食計畫不存在或該日飲食計畫不屬於此會員
            console.log("刪除失敗");
        }else if(response.status === 403){ //
            console.log("JWT失效,拒絕存取");
            localStorage.removeItem("JWT");
            window.location.replace("/"); //導回首頁,重新登入;
        }else if(response.status === 500){ //如果是500,代表伺服器(資料庫)內部錯誤
                console.log("伺服器錯誤");
        };
    }catch(message){
        console.log(`${message}`)
        throw Error('Fetching was not ok!!.')
    };
};



//新增飲食計畫
async function add_diet_plan(payload,jwt){
    try{
        let response = await fetch('/api/plans',{
                                     method: 'post',
                                     body : payload,
                                     headers: {"Authorization" : `Bearer ${jwt}`,'Content-Type': 'application/json'}
                                    });
        let result = await response.json();                            
        if(response.status === 201){ //新增我計畫完成
            //新增完成,插到我的計畫table
            let payload_obj = JSON.parse(payload);
            console.log(payload_obj);
            //新增我計畫成功,直接重新打一次get_diet_plan,把my_plan_page歸0,先把tbody清空
            let tbody = document.querySelector(".plan-body");
            while(tbody.firstChild){
                tbody.firstChild.remove(); 
            };    
            my_plan_page = 0;
            get_diet_plan(my_plan_page,"foredit");    
            //把新增計畫匡清空,提示訊息清空
            let protein = document.getElementsByName("new-plan_protein")[0];
            let fat = document.getElementsByName("new-plan_fat")[0];
            let carbs = document.getElementsByName("new-plan_carbs")[0];
            let calories = document.getElementsByName("new-plan_calories")[0];
            calories.value="";
            protein.value="";
            fat.value="";
            carbs.value="";
            let tip = document.querySelector(".tip");
            if(tip){
                tip.remove()
            };
        }else if (response.status === 403){
            console.log('JWT已失效,請重新登入');
            localStorage.removeItem("JWT");
            window.location.href = '/';
        }else if (response.status === 400){
            console.log(result);
        }else{
            console.log('伺服器錯誤');
        }
    }catch(message){
        console.log(`${message}`)
        throw Error('Fetching was not ok!!.')
    };  
}; 



//驗證新增飲食計畫資料
function validate_new_plan(){
    let protein = document.getElementsByName("new-plan_protein")[0];
    let fat = document.getElementsByName("new-plan_fat")[0];
    let carbs = document.getElementsByName("new-plan_carbs")[0];
    let calories = document.getElementsByName("new-plan_calories")[0];
    let result = true;
    if(!protein.value || Number(protein.value)<0 || !Number.isInteger(Number(protein.value))){
        show_tip('Enter an integer percentage','.new-input-protein');
        result = false;
        return result;
    }else if(!fat.value || Number(fat.value)<0 || !Number.isInteger(Number(fat.value))){
        show_tip('Enter an integer percentage','.new-input-fat');
        result = false;
        return result;
    }else if(!carbs.value || Number(carbs.value)<0 || !Number.isInteger(Number(carbs.value))){
        show_tip('Enter an integer percentage','.new-input-carbs');
        result = false;
        return result;
    }else if(!calories.value || Number(calories.value)<0 || !Number.isInteger(Number(calories.value))){
        show_tip('Enter an integer calories','.new-input-calories');
        result = false;
        return result;
    }else if( Number(carbs.value)+Number(fat.value)+Number(protein.value) !== 100 ){
        const tip = document.querySelector('.tip');
        if(tip){
            document.documentElement.style.setProperty('--color',"none");
            tip.remove();
        }
        result = false;
        return result;
    }
    return result     
};



//組織新增飲食計畫資料
function organize_new_plan(){
    let protein = document.getElementsByName("new-plan_protein")[0].value;
    let fat = document.getElementsByName("new-plan_fat")[0].value;
    let carbs = document.getElementsByName("new-plan_carbs")[0].value;
    let calories = document.getElementsByName("new-plan_calories")[0].value;
    let data={};
    data["plan_calories"] = Number(calories);
    data["protein"] = Number(protein);
    data["fat"] = Number(fat);
    data["carbs"] = Number(carbs);
    let current_date = new Date();
    let timestamp = Math.floor(current_date.getTime()/1000);
    data["create_at"] = timestamp;
    return JSON.stringify(data)
}




//製造編輯飲食計畫的tr
function create_plan_tr_edit(plan){
    let tr = document.createElement("tr");
    tr.classList.add("edit-plan-item");
    let th = document.createElement("th");
    th.classList.add("plan-name");
    th.appendChild(document.createTextNode(String(plan["plan_name"])));
    let td_p = document.createElement("td");
    td_p.classList.add("plan-protein");
    td_p.appendChild(document.createTextNode(String(plan["protein"])));
    let td_f = document.createElement("td");
    td_f.classList.add("plan-fat");
    td_f.appendChild(document.createTextNode(String(plan["fat"])));
    let td_c = document.createElement("td");
    td_c.classList.add("plan-calories");
    td_c.appendChild(document.createTextNode(String(plan["carbs"])));
    let td_calories = document.createElement("td");
    td_calories.classList.add("plan-calories");
    td_calories.appendChild(document.createTextNode(String(plan["plan_calories"])));
    let td_delete = document.createElement("td");
    td_delete.classList.add("delete");
    td_delete.setAttribute("id",plan["plan_id"]); //把plan_id直接放在垃圾桶
    let delete_icon = new Image();
    delete_icon.src = "/picture/icon_delete.png";
    td_delete.addEventListener("click",function(){ //註冊刪除飲食計畫
        can_get_my_plan = false; //按下去的時候要先變false
        delete_plan(this.id);
    });
    td_delete.appendChild(delete_icon);
    //
    tr.appendChild(th);
    tr.appendChild(td_p);
    tr.appendChild(td_f);
    tr.appendChild(td_c);
    tr.appendChild(td_calories);
    tr.appendChild(td_delete);
    return tr
}





//pop out出飲食計畫顯示匡
function render_my_plan_window(background){
    let load_plan_box = document.createElement("div");
    load_plan_box.classList.add("load-plan-box");
    let load_plan = document.createElement("div");
    load_plan.classList.add("load-plan");
    //小title
    let title_div = document.createElement("div");
    title_div.classList.add("edit-title");
    let span1 = document.createElement("span");
    span1.classList.add("load-plan-title");
    span1.innerHTML="Edit your diet plan.";
    title_div.appendChild(span1);
    //分隔線
    let break_line = document.createElement("div");
    break_line.classList.add("break");
    //飲食計畫
    let diet_plan = document.createElement("div");
    diet_plan.classList.add("diet-plan");//
    diet_plan.addEventListener("scroll",function(){ //plan table註冊滑動載入my-food事件
        if(this.scrollHeight-this.scrollTop <= this.clientHeight){
            if(can_get_my_plan && my_plan_page){
                can_get_my_plan = false;
                get_diet_plan(my_plan_page,"foredit");
            };
        };
    });
    let table = document.createElement("table");
    table.classList.add("plan-table");
    let thead = document.createElement("thead");
    let tr = document.createElement("tr");
    let th_text = ["\u00A0","Protein(%)","Fat(%)","Carbs(%)","Calories(kcal)","\u00A0"]
    for(let i=0;i<th_text.length;i++){
        let th = document.createElement("th");
        th.classList.add("head");
        th.appendChild(document.createTextNode(th_text[i]));
        tr.appendChild(th);
    };
    thead.appendChild(tr);
    table.appendChild(thead);
    let tbody = document.createElement("tbody");
    tbody.classList.add("plan-body");
    get_diet_plan(my_plan_page,"foredit"); //取得飲食計畫 ,先傳入預設0的my_plan_page
    table.appendChild(tbody);
    //
    diet_plan.appendChild(table);
    //
    load_plan.appendChild(title_div);
    load_plan.appendChild(break_line);
    load_plan.appendChild(diet_plan);
    //新增計畫區塊
    let add_plan = document.createElement("div");
    add_plan.classList.add("add-plan");
    //add your new plan
    let add_plan_title = document.createElement("div");
    add_plan_title.classList.add("add-plan_title");
    let span = document.createElement("span");
    span.classList.add("add-plan_span");
    span.innerHTML = "Add your new plan here.";
    add_plan_title.appendChild(span);
    //新protein
    let add_plan_protein = document.createElement("div");
    add_plan_protein.classList.add("add-plan_protein");
    let div_protein = document.createElement("div");
    div_protein.innerHTML = "Protein(%)";
    let input_protein = document.createElement("input");
    input_protein.classList.add("add-plan_input");
    input_protein.classList.add("new-input-protein");
    input_protein.setAttribute("type","number");
    input_protein.setAttribute("step","1");
    input_protein.setAttribute("min","0");
    input_protein.setAttribute("name","new-plan_protein");
    add_plan_protein.appendChild(div_protein);
    add_plan_protein.appendChild(input_protein);
    //新fat
    let add_plan_fat = document.createElement("div");
    add_plan_fat.classList.add("add-plan_fat");
    let div_fat = document.createElement("div");
    div_fat.innerHTML = "Fat(%)";
    let input_fat = document.createElement("input");
    input_fat.classList.add("add-plan_input");
    input_fat.classList.add("new-input-fat");
    input_fat.setAttribute("type","number");
    input_fat.setAttribute("step","1");
    input_fat.setAttribute("min","0");
    input_fat.setAttribute("name","new-plan_fat");
    add_plan_fat.appendChild(div_fat);
    add_plan_fat.appendChild(input_fat);
    //新carb
    let add_plan_carbs = document.createElement("div");
    add_plan_carbs.classList.add("add-plan_carbs");
    let div_carbs = document.createElement("div");
    div_carbs.innerHTML = "Carbs(%)";
    let input_carbs = document.createElement("input");
    input_carbs.classList.add("add-plan_input");
    input_carbs.classList.add("new-input-carbs");
    input_carbs.setAttribute("type","number");
    input_carbs.setAttribute("step","1");
    input_carbs.setAttribute("min","0");
    input_carbs.setAttribute("name","new-plan_carbs");
    add_plan_carbs.appendChild(div_carbs);
    add_plan_carbs.appendChild(input_carbs);
    //新calories
    let add_plan_calories = document.createElement("div");
    add_plan_calories.classList.add("add-plan_calories");
    let div_calories = document.createElement("div");
    div_calories.innerHTML = "Calories(%)";
    let input_calories = document.createElement("input");
    input_calories.classList.add("add-plan_input");
    input_calories.classList.add("new-input-calories");
    input_calories.setAttribute("type","number");
    input_calories.setAttribute("step","1");
    input_calories.setAttribute("min","0");
    input_calories.setAttribute("name","new-plan_calories");
    add_plan_calories.appendChild(div_calories);
    add_plan_calories.appendChild(input_calories); 
    //reminder
    let remind = document.createElement("div");
    remind.classList.add("add-plan-reminder");
    remind.innerHTML="(Percentage must add to 100%)";
    //最後
    add_plan.appendChild(add_plan_title);
    add_plan.appendChild(add_plan_protein);
    add_plan.appendChild(add_plan_fat);
    add_plan.appendChild(add_plan_carbs);
    add_plan.appendChild(add_plan_calories);
    load_plan.appendChild(add_plan);
    load_plan.appendChild(remind);
    //Cancel & save change button
    let select_btn = document.createElement("div");
    select_btn.classList.add("select-btn");
    let span_cancel = document.createElement("span");
    span_cancel.classList.add("cancel-select");
    span_cancel.innerHTML="Cancel";
    span_cancel.addEventListener("click",function(){ //關掉更新window
        //關掉框框
        document.body.classList.toggle("stop-scrolling");
        let bg = document.getElementsByClassName('bg');
        document.body.removeChild(bg[0]);
        //也要把全域變數變回null
        my_plan_page = 0;
        can_get_my_plan = true;
    });
    let span_select = document.createElement("span");
    span_select.classList.add("submit-select");
    span_select.addEventListener("click",function(){ //點擊新增飲食計畫
        //送出新增的飲食計畫前先檢查有沒有都填了＆資料正不正確
        let validate = validate_new_plan();
        if(validate){
            can_get_my_plan = false; //按下去的時候要先變false
            console.log("ok");
            let jwt = localStorage.getItem("JWT");
            let json_data = organize_new_plan();
            add_diet_plan(json_data,jwt);
        };     
    });
    span_select.innerHTML="Save change";
    select_btn.appendChild(span_cancel);
    select_btn.appendChild(span_select);
    //
    load_plan.appendChild(select_btn);
    //
    load_plan_box.appendChild(load_plan);
    background.appendChild(load_plan_box);
    return background;
}









/* My Plan */

function render_my_plan(navmenu){
    let personal_plan = document.createElement("div");
    personal_plan.classList.add("nav-page");
    personal_plan.classList.add("personal-plan");
    let span = document.createElement("span");
    span.setAttribute("id","dietplan");
    span.appendChild(document.createTextNode("Diet Plan"));
    span.addEventListener("click",function(){ //按下後產生我的飲食計畫
        let bg = render_my_plan_window(createBack());
        document.body.appendChild(bg);
    });
    personal_plan.appendChild(span);
    navmenu.appendChild(personal_plan);
}





//產生side bar
function render_sidebar(user_data){
    console.log('sidebar');
    if(5>6){   // 如果有xxx就不用在產生




    }else{ 
        let navmenu = document.querySelector(".navmenu");
        render_user_profile(navmenu,user_data);
        render_my_food(navmenu);
        render_my_plan(navmenu);


    }
    



}
