let record_id;   //當日紀錄的id全域變數
let date;        //目前所在日期
//紀錄edit更新後的營養素
let new_target_calories;
let new_target_protein;
let new_target_fat;
let new_target_carbs;





//刪除飲食紀錄
async function delete_intake(intake_id){
    let jwt = localStorage.getItem("JWT");
    try{
        let response = await fetch('/api/intakess?intake_id'+intake_id,{
                                                    method: 'delete',
                                                    headers: {"Authorization" : `Bearer ${jwt}`}
                                                });
        let result = await response.json();                                
        if(response.status===204){  //204 
            console.log(result);
            //把食物從畫面上移除
            let ul = document.querySelector(".food-ul");
            let li = document.getElementById(intake_id).parentElement;
            ul.removeChild(li);
        }else if(response.status === 400){ //刪除失敗,該飲食紀錄不存在或該飲食紀錄不屬於此會員
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

//新增飲食紀錄 (//尚未完成)
async function add_intake(){
    let jwt = localStorage.getItem("JWT");
    try{
        let response = await fetch("/api/intakes",{
                                                    method: 'post',
                                                    body : payload,
                                                    headers: {"Authorization" : `Bearer ${jwt}`}
                                                });
        let result = await response.json();                                
        if(response.status===201){  //201 
            console.log(result);
            //新增成功,顯示在吃過的東西,要再打一次api要intake_id(怎麼要到intake id)
            //直接加在insert_new_diet裡面,會回傳intake_id
            added_intake_id = result["intake_id"];
            payload["intake_id"] = added_intake_id;
            let li = create_li(payload);
            let ul = document.querySelector("food-ul");
            let first_li = ul.firstChild;
            first_li.before(li); //把新增的食物放到第一個
            //要更新current status數值
            let current_protein = document.querySelector(".current-protein_g");
            let current_carbs = document.querySelector(".current-carbs_g");
            let current_fat = document.querySelector(".current-fat_g");
            let new_protein = Number((current_protein.textContent.split("g)"))[0])+payload["protein"]
            let new_carbs = Number((current_carbs.textContent.split("g)"))[0])+payload["carbs"]
            let new_fat = Number((current_fat.textContent.split("g)"))[0])+payload["fat"]
            current_protein.innerHTML = String(new_protein)+"g";
            current_carbs.innerHTML = String(new_carbs)+"g";
            current_fat.innerHTML = String(new_fat)+"g";
//尚未完成            //還要更新長條圖


        }else if(response.status === 400){ //刪除失敗,新增資料有誤
            console.log("新增失敗");
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


//創造顯示吃過食物li tag
function create_li(food){
    let li = document.createElement("li");
    let span_name = document.createElement("span");
    let span_amount = document.createElement("span");
    let span_g = document.createElement("span");
    let delete_div = document.createElement("div");
    delete_div.classList.add("delete");
    delete_div.setAttribute("id",food["intake_id"]); //把intake_id直接放在垃圾桶
    let delete_icon = new Image();
    delete_icon.src = "/picture/icon_delete.png";
    delete_div.addEventListener("click",function(){ //註冊刪除飲食紀錄
        delete_intake(this.id);
    });
    span_name.appendChild(document.createTextNode(food["food_name"]));
    span_amount.appendChild(document.createTextNode(food["amount"]));
    span_g.appendChild(document.createTextNode("g"));
    delete_div.appendChild(delete_icon);
    li.appendChild(span_name);
    li.appendChild(span_amount);
    li.append(span_g);
    li.appendChild(delete_div);
    return li
};



//render出吃過的食物那塊
function show_consume(main_container,food_record){
    if(document.querySelector(".record-container")){ //如果已經有record-container就不用製造
        //只要改變food-ul裡面li內容,首先先移除舊的li
        let ul = document.querySelector(".food-ul");
        while(ul.firstChild){
            ul.removeChild(ul.firstChild);
        };
        //接著放入新的li
        for(let i = 0 ; i < food_record.length ; i++){
            let li = create_li(food_record[i]);
            ul.appendChild(li);
        };
    }else{
        let record_container = document.createElement("div");
        record_container.classList.add("record-container");
        let left_record = document.createElement("div");
        left_record.classList.add("left-record");
        let intake_record = document.createElement("div");
        intake_record.classList.add("intake-record");
        //吃過食物那塊
        let consume_food = document.createElement("div");
        consume_food.classList.add("consume-food");
        let ul = document.createElement("ul");
        ul.classList.add("food-ul")
        for(let i = 0;i < food_record.length ; i++){
            let li = create_li(food_record[i]);
            ul.appendChild(li);
        };
        consume_food.appendChild(ul);
        //搜尋食物那塊
        let input_area = document.createElement("div");
        input_area.setAttribute("id","input-area");
        let input_food = document.createElement("input");
        input_food.setAttribute("type","text");
        input_food.setAttribute("id","food_name");
        input_food.setAttribute("placeholder","Search Food...");
        input_food.setAttribute("autocomplete","off");
        input_food.addEventListener("input",function(){ //註冊搜尋食物事件
            let value = this.value;
            //console.log(this);
            if(value === ""){
                let input_area = document.getElementById("input-area");
                if(document.querySelector(".search-result")){
                    input_area.removeChild(document.querySelector(".search-result"))
                };
            }else{
                if(search_times <= 10){
                    search_times += 1;
                    //console.log(n);
                    let jwt = localStorage.getItem("JWT");
                    let search_promise = get_food(value,jwt);
                    search_promise.then((result)=>{
                        search_times -= 1;
                        //console.log(n);
                        console.log(result.data);
                        render_data(result.data);
                    });
                }    
            }    
        });
        let input_amount = document.createElement("input");
        input_amount.setAttribute("type","text");
        input_amount.setAttribute("id","food_portion");
        input_amount.setAttribute("placeholder","amount (g)");
        input_amount.setAttribute("autocomplete","off");
        let button = document.createElement("div");
        button.setAttribute("id","send_message");
        let add_icon = new Image();
        add_icon.src = "/picture/add.png";
        button.appendChild(add_icon);
        button.addEventListener("click",function(){ //註冊新增飲食紀錄
            //如果沒有選食物或份量,顯示訊息說要選
            //要滿足四個條件才代表有選好：1. select_food有東西 ,2. 搜尋結果框不在 3.食物input有value 4.有填量
            let input_food = document.getElementById("food_name");
            let input_amount = document.getElementById("food_portion");
            let search_result = document.querySelector(".search-result");
            if(select_food["food_name"]!== null && !search_result && input_amount.value.length!==0 && input_food.value.length!==0){
                //計算pfc攝取克數
                let amount = Number(Number(input_amount.value).toFixed(1));
                let portion = Number((amount/100).toFixed(1));
                let consume_protein = Number((portion * select_food["protein"]).toFixed(1));
                let consume_fat = Number((portion * select_food["fat"]).toFixed(1));
                let consume_carbs = Number((portion * select_food["fat"]).toFixed(1));
                let payload = {
                    "record_id" : record_id,
                    "food_name" : select_food["food_name"],
                    "protein" : consume_protein,
                    "fat" : consume_fat,
                    "carbs" : consume_carbs,
                    "amount" : amount
                }            
                add_intake(payload);
                //把input 清空
                input_food.value="";
            }else{ //顯示訊息說要選好
                let message = "Please confirm input is completed.";
                show_reminder(message); //4/28焓不知道要把顯示訊息插哪
            };


            
            add_intake();
        })
        input_area.appendChild(input_food);
        input_area.appendChild(input_amount);
        input_area.appendChild(button);
        //最後裝起來
        intake_record.appendChild(input_area);
        intake_record.appendChild(consume_food);
        left_record.appendChild(intake_record);
        record_container.appendChild(left_record);
        main_container.appendChild(record_container);
    };
};    


//顯示日期那塊
function show_date(main_container,date_format){
    if(document.querySelector(".calender-container")){ //如果已經有這個div,就不用重新製造
        //只要換日期顯示
        let show_date_div = document.querySelector(".show-date");
        show_date_div.innerHTML = date_format; 
    }else{
        let calender_container_div = document.createElement("div");
        calender_container_div.classList.add("calender-container");
        let datepicker_toggle_div = document.createElement("div");
        datepicker_toggle_div = document.classList.add("datepicker-toggle");
        let date_img = new Image();
        date_img.src = "/picture/calendar48.png";
        date_img.classList.add("datepicker-toggle-button");
        date_input = document.createElement("input");
        date_input.classList.add("datepicker-input");
        date_input.setAttribute("type","date");
        date_input.addEventListener("change",function(){ //註冊點選日期事件
            if(this.value !== date){ //如果點選的日期不等於目前所在日期才要打API要紀錄資料
                let choose_date = this.valueAsDate; //所選日期
                let year = choose_date.getFullYear(); //2022
                let month = choose_date.getMonth()+1  //4
                let date = choose_date.getDate();   //28
                let show_date_format = Month[month] + " "+String(date) + ", " + String(year); //要顯示的日期
                let new_date = new Date(year,month,date);
                let utc =  Date.UTC(new_date.getUTCFullYear(), new_date.getUTCMonth(), new_date.getUTCDate(),new_date.getUTCHours(), new_date.getUTCMinutes(), new_date.getUTCSeconds());
                if(month<10){
                    date = String(year) + "-" + "0" + String(month)+"-"+String(date);
                }else{
                    date = String(year) + "-" +String(month)+"-"+String(date);
                };
                get_record(utc,show_date_format);
            }
        });
        datepicker_toggle_div.appendChild(date_img);
        datepicker_toggle_div.appendChild(date_input);
        let show_date_div = document.createElement("div");
        show_date_div.classList.add("show-date");
        show_date_div.appendChild(document.createTextNode(date_format));
        calender_container_div.appendChild(datepicker_toggle_div);
        calender_container_div.appendChild(show_date_div);
        main_container.appendChild(calender_container_div);
    }    
}


//編輯紀錄
async function update_target(payload,jwt){
    try{
        let response = await fetch('/api/records',{
                                     method: 'patch',
                                     body : payload,
                                     headers: {"Authorization" : `Bearer ${jwt}`,'Content-Type': 'application/json'}
                                    });
        let result = await response.json();                            
        if(response.ok){ //更新紀錄target完成
            new_target_calories = payload["plan_calories"];
            new_target_protein =  payload["protein"];
            new_target_fat =  payload["fat"];
            new_target_carbs =  payload["carbs"];
            //關掉框框
            document.body.classList.toggle("stop-scrolling");
            let bg = document.getElementsByClassName('bg');
            document.body.removeChild(bg[0]);
            //把target顯示更新
            let plan_calo = document.querySelector(".plan-calo")
            plan_calo.innerHTML =  new_target_calories;
            //目標蛋白質
            let plan_protein = document.querySelector(".plan-protein")
            let plan_p_g = "~"+String(Math.round((new_target_calories*new_target_protein/100)/4))+"g"
            plan_protein.innerHTML = plan_p_g;
            let percent_protein = document.querySelector(".percent-protein");
            percent_protein.innerHTML =  "("+String(new_target_protein)+"%"+")";
            //目標碳水
            let plan_carbs = document.querySelector(".plan-carbs")
            let plan_c_g = "~"+String(Math.round((new_target_calories*new_target_carbs/100)/4))+"g"
            plan_carbs.innerHTML = plan_c_g;
            let percent_carbs = document.querySelector(".percent-carbs");
            percent_carbs.innerHTML =  "("+String(new_target_carbs)+"%"+")";
            //目標脂肪
            let plan_fat = document.querySelector(".plan-fat")
            let plan_f_g = "~"+String(Math.round((new_target_calories*new_target_fat/100)/9))+"g"
            plan_fat.innerHTML = plan_f_g;
            let percent_fat = document.querySelector(".percent-fat");
            percent_fat.innerHTML =  "("+String(new_target_fat)+"%"+")";
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
    }    
};    



//驗證更新target資料
function validate_target_update(){
    let calories = document.getElementById("update-calories");
    let protein = document.getElementById("update-protein");
    let fat = document.getElementById("update-fat");
    let carbs = document.getElementById("update-carb");
    let result = true;
    if(!calories.value || Number(calories.value)<0 || !Number.isInteger(Number(calories.value))){
        show_tip('Enter an integer calories','.calo-title');
        result = false;
        return result;
    }else if(!protein.value || Number(protein.value)<0 || !Number.isInteger(Number(protein.value))){
        show_tip('Enter an integer percentage','.protein-title');
        result = false;
        return result;
    }else if(!fat.value || Number(fat.value)<0 || !Number.isInteger(Number(fat.value))){
        show_tip('Enter an integer percentage','.fat-title');
        result = false;
        return result;
    }else if(!carbs.value || Number(carbs.value)<0 || !Number.isInteger(Number(carbs.value))){
        show_tip('Enter an integer percentage','.carb-title');
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

//組織更新targt資料,打更新record API
function organize_target_update(){
    let formdata = new FormData(document.querySelector('.edit-form'));
    let data={}
    for(let pair of formdata.entries()){
        if(pair[0]==='update-calo'){
            let n = Number(pair[1]);
            data["plan_calories"]=n;
        }else if(pair[0]==='update-p'){
            let n  = Number(pair[1]);
            data["protein"]=n;
        }else if(pair[0]==='update-f'){
            let n  = Number(pair[1]);
            data["fat"]=n;
        }else if(pair[0]==='update-c'){
            let n  = Number(pair[1]);
            data["carbs"]=n;
        }
    };
    data["record_id"] = record_id;
    console.log(data);
    return JSON.stringify(data)
}



//創造背景,讓頁面無法滑動
function createBack(){
    //讓頁面無法滑動
    document.body.classList.toggle("stop-scrolling");
    //創造背景
    let background = document.createElement("div");
    background.className = "bg";
    return background;
};

//跳出更改視窗
function pop_edit_window(background){
    let edit_box = document.createElement("div");
    edit_box.classList.add("edit-box");
    let edit_form = document.createElement("form");
    edit_form.classList.add("edit-form");
    //小title
    let title_div = document.createElement("div");
    title_div.classList.add("edit-title");
    title_div.innerHTML = "Edit your nutrition target"
    //提示語
    let remider_div = document.createElement("div");
    remider_div.classList.add("update-remind");
    remider_div.innerHTML = "Percentages (Must add to 100%)";
    //填入卡路里
    let fill_calories = document.createElement("div");
    fill_calories.classList.add("fill-calories");
    fill_calories.classList.add("fill");
    let span1 = document.createElement("span");
    span1.classList.add("update-title");
    span1.classList.add("calo-title");
    span1.innerHTML = "Calories :";
    let input_calo = document.createElement("input");
    input_calo.setAttribute("id","update-calories");
    input_calo.setAttribute("type","number");
    input_calo.setAttribute("step","1");
    input_calo.setAttribute("min","0");
    input_calo.setAttribute("name","update-calo");
    let span1_1 = document.createElement("span");
    span1_1.innerHTML="kcals";
    fill_calories.appendChild(span1);
    fill_calories.appendChild(input_calo);
    fill_calories.appendChild(span1_1);
    //填入蛋白質
    let fill_protein = document.createElement("div");
    fill_protein.classList.add("fill-protein");
    fill_protein.classList.add("fill");
    let span2 = document.createElement("span");
    span2.classList.add("update-title");
    span2.classList.add("protein-title");
    span2.innerHTML = "Protein :";
    let input_p = document.createElement("input");
    input_p.setAttribute("id","update-protein");
    input_p.setAttribute("type","number");
    input_p.setAttribute("step","1");
    input_p.setAttribute("min","0");
    input_p.setAttribute("name","update-p");
    let span2_1 = document.createElement("span");
    span2_1.innerHTML="%";
    fill_protein.appendChild(span2);
    fill_protein.appendChild(input_p);
    fill_protein.appendChild(span2_1);
    //填入脂肪
    let fill_fat = document.createElement("div");
    fill_fat.classList.add("fill-fat");
    fill_fat.classList.add("fill");
    let span3 = document.createElement("span");
    span3.classList.add("update-title");
    span3.classList.add("fat-title");
    span3.innerHTML = "Fat :";
    let input_f = document.createElement("input");
    input_f.setAttribute("id","update-fat");
    input_f.setAttribute("type","number");
    input_f.setAttribute("step","1");
    input_f.setAttribute("min","0");
    input_f.setAttribute("name","update-f");
    let span3_1 = document.createElement("span");
    span3_1.innerHTML="%";
    fill_fat.appendChild(span3);
    fill_fat.appendChild(input_f);
    fill_fat.appendChild(span3_1);
    //填入碳水
    let fill_carbs = document.createElement("div");
    fill_carbs.classList.add("fill-carbs");
    fill_carbs.classList.add("fill");
    let span4 = document.createElement("span");
    span4.classList.add("update-title");
    span4.classList.add("carb-title");
    span4.innerHTML = "Carbs :";
    let input_c = document.createElement("input");
    input_c.setAttribute("id","update-carb");
    input_c.setAttribute("type","number");
    input_c.setAttribute("step","1");
    input_c.setAttribute("min","0");
    input_c.setAttribute("name","update-c");
    let span4_1 = document.createElement("span");
    span4_1.innerHTML="%";
    fill_carbs.appendChild(span4);
    fill_carbs.appendChild(input_c);
    fill_carbs.appendChild(span4_1);
    //按鈕
    let btn_div = document.createElement("div");
    btn_div.classList.add("update-btn");
    let submit_btn = document.createElement("span");
    submit_btn.classList.add("submit-update");
    submit_btn.innerHTML = "Save change";
    submit_btn.addEventListener("click",function(){ //註冊更新目標事件
        //送出更新資料前先檢查有沒有都填了＆資料正不正確
        let validate = validate_target_update();
        if(validate){
            console.log("ok");
            let jwt = localStorage.getItem("JWT");
            let json_data = organize_target_update();
            update_target(json_data,jwt);
        };        
    });
    let close_btn = document.createElement("span");
    close_btn.classList.add("close-update");
    close_btn.innerHTML = "Close";
    close_btn.addEventListener("click",function(){ //關掉更新window
        //關掉框框
        document.body.classList.toggle("stop-scrolling");
        let bg = document.getElementsByClassName('bg');
        document.body.removeChild(bg[0]);
    })
    btn_div.appendChild(close_btn);
    btn_div.appendChild(submit_btn);
    //最後
    let break_div = document.createElement("div");
    break_div.classList.add("break");
    edit_form.appendChild(title_div);
    edit_form.appendChild(fill_calories);
    edit_form.appendChild(break_div)
    edit_form.appendChild(remider_div);
    edit_form.appendChild(fill_protein);
    edit_form.appendChild(fill_fat);
    edit_form.appendChild(fill_carbs);
    edit_form.appendChild(btn_div);
    edit_box.appendChild(edit_form);
    background.appendChild(edit_box);
    return background;
}



//顯示右下角那塊
function show_pfcc_section(right_record,day_record,food_record){
    let plan_nutrition = document.createElement("div");
    plan_nutrition.classList.add("plan-nutrition");
    let current_status = document.createElement("div");
    current_status.classList.add("current-status");
    let planned = document.createElement("div");
    planned.classList.add("planned");
    //處理現況區
    let current_title = document.createElement("div");
    current_title.classList.add("current-title");
    current_title.innerHTML = "CURRENT STATUS";
    //現況區-熱量
    let current_calories = document.createElement("div");
    current_calories.classList.add("current");
    current_calories.classList.add("current-calories");
    let span_calories = document.createElement("span");
    span_calories.classList.add("nutri_name");
    span_calories.innerHTML = "Calories";
    current_calories.appendChild(span_calories);
    //現況區-蛋白質
    let current_protein = document.createElement("div");
    current_protein.classList.add("current");
    current_protein.classList.add("current-protein");
    let span_protein = document.createElement("span");
    span_protein.classList.add("nutri_name");
    span_protein.innerHTML = "Protein";
    current_protein.appendChild(span_protein);
    //現況區-碳水
    let current_carbohydrate = document.createElement("div");
    current_carbohydrate.classList.add("current");
    current_carbohydrate.classList.add("current-carbohydrate");
    let span_carb = document.createElement("span");
    span_carb.classList.add("nutri_name");
    span_carb.innerHTML = "Carbs";
    current_carbohydrate.appendChild(span_carb);
    //現況區-脂肪
    let current_fat = document.createElement("div");
    current_fat.classList.add("current");
    current_fat.classList.add("current-fat");
    let span_fat = document.createElement("span");
    span_fat.classList.add("nutri_name");
    span_fat.innerHTML = "Fat";
    current_fat.appendChild(span_fat);
    //
    let current_calo = document.createElement("span");
    current_calo.classList.add("current-calo");//
    let current_p = document.createElement("span");
    current_p.classList.add("current-protein_g");//
    let current_c = document.createElement("span");
    current_c.classList.add("current-carbs_g");//
    let current_f = document.createElement("span");
    current_f.classList.add("current-fat_g");//
    if(food_record){ //如果有飲食紀錄
        let protein=0;
        let fat=0;
        let carbs=0;
        let calories=0;
        for(let i=0;i<food_record.length;i++){
            protein+=i["protein"];
            fat+=i["fat"];
            carbs+=i["carbs"];
        };
        calories = Math.round((protein*4)+(fat*9)+(carbs*4)) //取整數
        protein = protein.toFixed(1)+"g"
        carbs = carbs.toFixed(1)+"g";
        fat = fat.toFixed(1)+"g";
        current_calo.innerHTML = calories;
        current_p.innerHTML = protein;
        current_c.innerHTML = carbs;
        current_f.innerHTML = fat;
    }else{ //如果沒有
        let protein="0"+"g";
        let fat="0"+"g";
        let carbs="0"+"g";
        let calories="0"+"g";
        current_calo.innerHTML = calories;
        current_p.innerHTML = protein;
        current_c.innerHTML = carbs;
        current_f.innerHTML = fat;
    }
    current_calories.appendChild(current_calo);//
    current_protein.appendChild(current_p);//
    current_carbohydrate.appendChild(current_c);//
    current_fat.appendChild(current_f);//
    //處理目標區
    //target-title
    let target_title =  document.createElement("div");
    target_title.classList.add("target-title");
    let target_span = document.createElement("span");
    target_span.innerHTML="Target";
    let edit_span = document.createElement("span");
    edit_span.classList.add("edit-button");
    edit_span.addEventListener("click",function(){ //按下編輯目標事件,跳出更改視窗
        let bg = pop_edit_window(createBack());
        document.body.appendChild(bg);
    })
    target_title.appendChild(target_span);
    target_title.appendChild(edit_span);
    //plan-calories
    let plan_calories = document.createElement("div");
    plan_calories.classList.add("plan");
    let plan_calo = document.createElement("span");
    plan_calo.classList.add("plan-calo")
    plan_calo.innerHTML = day_record["plan_calories"];
    plan_calories.appendChild(plan_calo);
    //plan-protein
    let plan_protein = document.createElement("div");
    plan_protein.classList.add("plan");
    let plan_p = document.createElement("span");
    plan_p.classList.add("plan-protein");
    let plan_p_g = "~"+String(Math.round((day_record["plan_calories"]*day_record["protein"]/100)/4))+"g"
    plan_p.innerHTML = plan_p_g;
    let percent_protein = document.createElement("span");
    percent_protein.classList.add("percent-protein");
    percent_protein.innerHTML = "("+String(day_record["protein"])+"%"+")";
    plan_protein.appendChild(plan_p);
    plan_protein.appendChild(percent_protein);
    //plan-carbs
    let plan_carbs = document.createElement("div");
    plan_carbs.classList.add("plan");
    let plan_c = document.createElement("span");
    plan_c.classList.add("plan-carbs");
    let plan_c_g = "~"+String(Math.round((day_record["plan_calories"]*day_record["carbs"]/100)/4))+"g"
    plan_c.innerHTML = plan_c_g;
    let percent_carbs = document.createElement("span");
    percent_carbs.classList.add("percent-carbs");
    percent_carbs.innerHTML = "("+String(day_record["carbs"])+"%"+")";
    plan_carbs.appendChild(plan_c);
    plan_carbs.appendChild(percent_carbs);
    //plan-fat
    let plan_fat = document.createElement("div");
    plan_fat.classList.add("plan");
    let plan_f = document.createElement("span");
    plan_f.classList.add("plan-fat");
    let plan_f_g = "~"+String(Math.round((day_record["plan_calories"]*day_record["fat"]/100)/9))+"g"
    plan_f.innerHTML = plan_f_g;
    let percent_fat = document.createElement("span");
    percent_fat.classList.add("percent-fat");
    percent_fat.innerHTML = "("+String(day_record["fat"])+"%"+")";
    plan_fat.appendChild(plan_f);
    plan_fat.appendChild(percent_fat);
    //最後加上
    current_status.appendChild(current_title);
    current_status.appendChild(current_calories);
    current_status.appendChild(current_protein);
    current_status.appendChild(current_carbohydrate);
    current_status.appendChild(current_fat);
    planned.appendChild(target_title);
    planned.appendChild(plan_calories);
    planned.appendChild(plan_protein);
    planned.appendChild(plan_carbs);
    planned.appendChild(plan_fat);
    plan_nutrition.appendChild(current_status);
    plan_nutrition.appendChild(planned);
    right_record.appendChild(plan_nutrition);
}

//顯示長條圖
function show_chart_section(){

}



//顯示右邊那塊 (//尚未完成 )
function show_right_section(record_container,day_record,food_record){
    if(document.querySelector(".right-record")){ //如果已經有right-record
        //只要更新current status裡的calories,protein,carbs,fat
        let current_calo = document.querySelector(".current-calo");
        let current_p = document.querySelector(".current-protein_g");
        let current_c = document.querySelector(".current-carbs_g");
        let current_f = document.querySelector(".current-fat_g");
        if(food_record){ //如果有飲食紀錄
            let protein=0;
            let fat=0;
            let carbs=0;
            let calories=0;
            for(let i=0;i<food_record.length;i++){
                protein+=i["protein"];
                fat+=i["fat"];
                carbs+=i["carbs"];
            };
            calories = Math.round((protein*4)+(fat*9)+(carbs*4)) //取整數
            protein = protein.toFixed(1)+"g"
            carbs = carbs.toFixed(1)+"g";
            fat = fat.toFixed(1)+"g";
            current_calo.innerHTML = calories;
            current_p.innerHTML = protein;
            current_c.innerHTML = carbs;
            current_f.innerHTML = fat;
        }else{ //如果沒有
            let protein="0"+"g";
            let fat="0"+"g";
            let carbs="0"+"g";
            let calories="0"+"g";
            current_calo.innerHTML = calories;
            current_p.innerHTML = protein;
            current_c.innerHTML = carbs;
            current_f.innerHTML = fat;
        }
        //只要更新target裡的calories,protein,carbs,fat
        let plan_calo = document.querySelector(".plan-calo"); 
        plan_calo.innerHTML = day_record["plan_calories"];
        //
        let plan_p = document.querySelector(".plan-protein");
        let plan_p_g = "~"+String(Math.round((day_record["plan_calories"]*day_record["protein"]/100)/4))+"g"
        plan_p.innerHTML = plan_p_g;
        let percent_protein = document.querySelector(".percent-protein")
        percent_protein.innerHTML = "("+String(day_record["protein"])+"%"+")";
        //
        let plan_c = document.querySelector(".plan-carbs");
        let plan_c_g = "~"+String(Math.round((day_record["plan_calories"]*day_record["carbs"]/100)/4))+"g"
        plan_c.innerHTML = plan_c_g;
        let percent_carbs = document.querySelector(".percent-carbs")
        percent_carbs.innerHTML = "("+String(day_record["carbs"])+"%"+")";
        //
        let plan_f = document.querySelector(".plan-fat");
        let plan_f_g = "~"+String(Math.round((day_record["plan_calories"]*day_record["fat"]/100)/9))+"g"
        plan_f.innerHTML = plan_p_g;
        let percent_fat = document.querySelector(".percent-fat")
        percent_fat.innerHTML = "("+String(day_record["fat"])+"%"+")";
//尚未完成        //只要更新長條圖



    }else{
        let right_record = document.createElement("div");
        right_record.classList.add("right-record");
        //把right-record分別丟進chart和pfc function
        show_chart_section(right_record,day_record,food_record);
        show_pfcc_section(right_record,day_record,food_record);
        record_container.appendChild(right_record);
    }
}






// 打/api/records 取得該日紀錄資料
async function get_record(timestamp,show_date_format){
    let jwt = localStorage.getItem("JWT");
    try{
        let response = await fetch('/api/records?datetime'+String(timestamp),{
                                                    method: 'get',
                                                    headers: {"Authorization" : `Bearer ${jwt}`}
                                                });
        let result = await response.json();                                
        if(response.ok){  //200情況下 
            //console.log(result);
            //1.移除loading動畫
            let main_container = document.querySelector(".main-container");
            let loading = document.getElementById("loading");
            if(loading){
                main_container.removeChild(loading); 
            };
            //2.顯示日期
            show_date(main_container,show_date_format);
            if(result["day_record"]){  //表示該日有紀錄
                record_id = result["day_record"]["record_id"]
                day_record = result["day_record"];
                food_record = result["food_record"];
                //秀出吃過和搜尋食物那塊
                show_consume(main_container,food_record);
                //秀出右邊區塊,這時候一定已經有record-container
                let record_container = document.querySelector(".record-container");
                show_right_rection(record_container,day_record,food_record);
            }else{ //表示該日無紀錄

            };    
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
    }; 

};



//動態render整個紀錄主畫面
function render_record(){
    //要傳給server query的timestamp
    let current_date = new Date();
    let year = current_date.getFullYear(); //2022
    let month = current_date.getMonth()+1  //4
    let date = current_date.getDate();   //28
    let show_date_format = Month[month] + " "+String(date) + ", " + String(year); //要顯示的日期
    let new_date = new Date(year,month,date);
    let now_utc =  Date.UTC(new_date.getUTCFullYear(), new_date.getUTCMonth(), new_date.getUTCDate(),new_date.getUTCHours(), new_date.getUTCMinutes(), new_date.getUTCSeconds());
    if(month<10){
        date = String(year) + "-" + "0" + String(month)+"-"+String(date);
    }else{
        date = String(year) + "-" +String(month)+"-"+String(date);
    };
    get_record(now_utc,show_date_format);
};







let Month={
    1:"JAN",
    2:"FEB",
    3:"MAR",
    4:"APR",
    5:"MAY",
    6:"JUN",
    7:"JUL",
    8:"AUG",
    9:"SEP",
    10:"OCT",
    11:"NOV",
    12:"DEC"
}