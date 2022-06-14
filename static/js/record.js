let record_id;
let on_which_date;  //what date currently on 
let on_date_utc;    //what date currently on in timestamp 
let on_date_format; //what date currently on in display format
let new_target_calories; //nutrition after edited 
let new_target_protein;
let new_target_fat;
let new_target_carbs;
let select_diet_plan_id; //diet plan id for loading
let my_plan_page = 0; // diet plan page
let can_get_my_plan = true;
let public_food_page = 0; //searching public food page & lock
let search_times = 0;
let can_get_public_food_scroll = true;


//delete intake record
async function delete_intake(intake_id_token,datetime,record_id_){
    let jwt = localStorage.getItem("JWT");
    let intake_id = intake_id_token.split('-')[1];
    try{
        let response = await fetch(`/api/intakes?intake_id=${intake_id}&datetime=${datetime}&record_id=${record_id_}`,{
                                                    method: 'delete',
                                                    headers: {"Authorization" : `Bearer ${jwt}`}
                                                });                                                                     
        if(response.status===204){  //204 
            //update currrent status
            let tr = document.getElementById(intake_id_token).parentElement;
            let current_calories = document.querySelector(".current-calo");
            let current_protein = document.querySelector(".current-protein_g");
            let current_carbs = document.querySelector(".current-carbs_g");
            let current_fat = document.querySelector(".current-fat_g");
            let delete_protein = Number(tr.getElementsByClassName("p")[0].textContent);
            let delete_fat = Number(tr.getElementsByClassName("f")[0].textContent);
            let delete_carbs = Number(tr.getElementsByClassName("c")[0].textContent);
            let delete_calories = delete_protein*4 + delete_fat*9 + delete_carbs*4;
            let new_calories = Math.round(Number(current_calories.textContent) - delete_calories);
            let new_protein = Number((Number((current_protein.textContent.split("g"))[0]) - delete_protein).toFixed(1));
            let new_carbs = Number((Number((current_carbs.textContent.split("g"))[0]) - delete_carbs).toFixed(1));
            let new_fat = Number((Number((current_fat.textContent.split("g"))[0]) - delete_fat).toFixed(1));
            current_calories.innerHTML = String(new_calories);
            current_protein.innerHTML = String(new_protein)+"g";
            current_carbs.innerHTML = String(new_carbs)+"g";
            current_fat.innerHTML = String(new_fat)+"g"; 
            tr.remove(); //remove from the screen 
            let canvas = Chart.getChart("pfc"); //update pie chart
            if(canvas){
                canvas.destroy();
            };
            let pie = document.getElementById("pfc").getContext("2d");
            let percentage_p = Math.round(new_protein*4/new_calories*100);
            let percentage_f = Math.round(new_fat*9/new_calories*100);
            let percentage_c = 100 - percentage_p - percentage_f;
            group.amount[0] = percentage_p;
            group.amount[1] = percentage_c;
            group.amount[2] = percentage_f;
            let PieChart = new Chart(pie,{type:'pie',data:DataEC, options: {plugins:optionsEC}});
        }else if(response.status === 400){ 
            let result = await response.json();  
            console.log(result);
            console.log("刪除失敗");
        }else if(response.status === 403){ //
            console.log("JWT失效,拒絕存取");
            localStorage.removeItem("JWT");
            window.location.replace("/"); //redirect back to '/'
        }else if(response.status === 500){ 
                console.log("伺服器錯誤");
        };
    }catch(message){
        console.log(`${message}`)
        throw Error('Fetching was not ok!!.')
    };
};


//add intake record
async function add_intake(payload,method){
    let jwt = localStorage.getItem("JWT");
    try{
        let response = await fetch("/api/intakes",{
                                                    method: 'post',
                                                    body : payload,
                                                    headers: {"Authorization" : `Bearer ${jwt}`,'Content-Type': 'application/json'}
                                                });
        let result = await response.json();                                
        if(response.status===201){ 
            let payload_obj = JSON.parse(payload);
            //added successfully , showing on intake record 
            added_intake_id = result["intake_id"];
            payload_obj["intake_id"] = added_intake_id;
            let tr = create_tr(payload_obj);
            let tbody = document.querySelector(".food-body");
            let first_tr = tbody.firstChild;
            if(first_tr){
                first_tr.before(tr); //put to the first one 
            }else{
                tbody.appendChild(tr);
            };
            feather.replace();
            //update current status value
            //decide which action is used in calorie part
            if(method === "search" || method === "load"){
                let current_calories = document.querySelector(".current-calo");
                let new_calories = Number(current_calories.textContent)+select_food["calories"];
                current_calories.innerHTML = String(new_calories);
            };
            let current_protein = document.querySelector(".current-protein_g");
            let current_carbs = document.querySelector(".current-carbs_g");
            let current_fat = document.querySelector(".current-fat_g");
            let new_protein = Number((Number((current_protein.textContent.split("g"))[0])+payload_obj["protein"]).toFixed(1));
            let new_carbs = Number((Number((current_carbs.textContent.split("g"))[0])+payload_obj["carbs"]).toFixed(1));
            let new_fat = Number((Number((current_fat.textContent.split("g"))[0])+payload_obj["fat"]).toFixed(1));
            current_protein.innerHTML = String(new_protein)+"g";
            current_carbs.innerHTML = String(new_carbs)+"g";
            current_fat.innerHTML = String(new_fat)+"g";
            //set "select_food" back to null 
            select_food={"food_name":null,
                 "food_id":null, 
                 "protein":null,
                 "carbs":null,
                 "fat":null, 
                 "calories":null}
            //update pie chart
            let canvas = Chart.getChart("pfc");
            if(canvas){
                canvas.destroy();
            };
            let pie = document.getElementById("pfc").getContext("2d");
            let temp_calories = new_protein*4 + new_fat*9 + new_carbs*9;
            let percentage_p = Math.round(new_protein*4/temp_calories*100);
            let percentage_f = Math.round(new_fat*9/temp_calories*100);
            let percentage_c = 100 - percentage_p - percentage_f;
            group.amount[0] = percentage_p;
            group.amount[1] = percentage_c;
            group.amount[2] = percentage_f;
            let PieChart = new Chart(pie,{type:'pie',data:DataEC, options: {plugins:optionsEC}});
        }else if(response.status === 400){ 
            console.log("新增失敗");
        }else if(response.status === 403){ 
            console.log("JWT失效,拒絕存取");
            localStorage.removeItem("JWT");
            window.location.replace("/"); 
        }else if(response.status === 500){ 
                console.log("伺服器錯誤");
        };
    }catch(message){
        console.log(`${message}`)
        throw Error('Fetching was not ok!!.')
    };    
};


//create tr tag for food had been eaten
function create_tr(food){
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
    let td_amount = document.createElement("td");
    td_amount.classList.add("a");
    td_amount.appendChild(document.createTextNode(String(food["amount"])));
    let td_delete = document.createElement("td");
    td_delete.classList.add("delete");
    td_delete.setAttribute("id","del-"+food["intake_id"]); //put intake_id in the grabage icon
    let delete_icon = document.createElement("i");
    delete_icon.setAttribute("data-feather","trash");
    td_delete.addEventListener("click",function(){ //register delete intake record
        delete_intake(this.id,on_date_utc,record_id);
    });
    td_delete.appendChild(delete_icon);
    tr.appendChild(th);
    tr.appendChild(td_p);
    tr.appendChild(td_f);
    tr.appendChild(td_c);
    tr.appendChild(td_amount);
    tr.appendChild(td_delete);
    return tr;
};


function create_plan_tr_load(plan){
    let tr = document.createElement("tr");
    tr.setAttribute("id","plan-"+plan["plan_id"]);
    tr.classList.add("plan-item");
    tr.addEventListener("click",function(){  //when click on plan will assign "plan_id" to global variable and change color
        let previous_selected = document.querySelector(".selected");
        if(previous_selected){
            previous_selected.classList.toggle("selected");
        };
        select_diet_plan_id = this.id;
        this.classList.toggle("selected");    
    });
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
    tr.appendChild(th);
    tr.appendChild(td_p);
    tr.appendChild(td_f);
    tr.appendChild(td_c);
    tr.appendChild(td_calories);
    return tr;
}



function search(){
    let value = document.getElementById("food_name").value;
    can_get_public_food_scroll = true;
    public_food_page = 0;
    let jwt = localStorage.getItem("JWT");
    let search_promise = get_food(value,jwt,public_food_page);
    search_promise.then((result)=>{
        if(document.getElementById("food_name").value.length!==0){
            let next_page = result["nextPage"];
            public_food_page = next_page;
            render_data(result.data);
        };    
    });
}


let debounce_search = _.debounce(search, 800);



function pop_search_food(background){
    let search_food_box = document.createElement("div");
    search_food_box.classList.add("search-food-box");
    let input_area = document.createElement("div");
    input_area.setAttribute("id","input-area");
    let input_food = document.createElement("input");
    input_food.setAttribute("type","text");
    input_food.setAttribute("id","food_name");
    input_food.setAttribute("placeholder","Search Food...");
    input_food.setAttribute("autocomplete","off");
    input_food.addEventListener("input",function(){ //register search food event 
        let value = this.value;
        if(value.length === 0){
            let input_area = document.getElementById("input-area");
            if(document.querySelector(".search-result")){
                input_area.removeChild(document.querySelector(".search-result"))
            };
            select_food = {"food_name":null,
                    "food_id":null, 
                    "protein":null,
                    "carbs":null,
                    "fat":null,
                    "calories":null};
            let l = [".consume-p",".consume-f",".consume-c",".consume-calo"];
            //if no food name input, pfc calo back to zero
            for(let i = 0;i<l.length;i++){
                let td = document.querySelector(l[i]);
                td.innerHTML="0";
            };        
            search_times = 0;
            can_get_public_food_scroll = true;
            public_food_page = 0;
        }else{
            debounce_search();   
        };    
    });
    let input_amount = document.createElement("input");
    input_amount.setAttribute("type","number");
    input_amount.setAttribute("id","food_portion");
    input_amount.setAttribute("placeholder","amount (g)");
    input_amount.setAttribute("step","0.1");
    input_amount.setAttribute("min","0");
    input_amount.addEventListener("input",function(){
        let value = this.value;
        let search_result = document.querySelector(".search-result"); 
        let l = [".consume-p",".consume-f",".consume-c",".consume-calo"];
        if(!value){  //if no amount input, pfc calo back to zero
            for(let i = 0;i<l.length;i++){
                let td = document.querySelector(l[i]);
                td.innerHTML="0";
            };
        }else if(Number(this.value) && select_food["food_name"]!== null && !search_result ){
            //if 1.input number 2.no food search result box 3. select_food is not null
            let precise_portion = Number(this.value)/100;
            let consume_protein = (precise_portion * select_food["protein"]).toFixed(1);
            let consume_fat = (precise_portion * select_food["fat"]).toFixed(1);
            let consume_carbs =(precise_portion * select_food["carbs"]).toFixed(1);
            let consume_calories = Math.round((precise_portion*select_food["protein"]*4)+(precise_portion*select_food["fat"]*9)+(precise_portion*select_food["carbs"]*4));
            consumes = [consume_protein,consume_fat,consume_carbs,consume_calories]
            for(let i = 0;i<l.length;i++){
                let td = document.querySelector(l[i]);
                td.innerHTML= String(consumes[i]);
            };
        };
    });
    input_area.appendChild(input_food);
    input_area.appendChild(input_amount); 
    search_food_box.appendChild(input_area);
    //display food pfc and calories 
    let consume_info_box = document.createElement("div");
    consume_info_box.classList.add("consume-info-box");
    let consume_info_table = document.createElement("table");
    consume_info_table.classList.add("consume-info-table");
    let thead = document.createElement("thead");
    let tr = document.createElement("tr");
    let th_text = ["Protein(g)","Fat(g)","Carbs(g)","Calories(kcal)"]
    for(let i=0;i<th_text.length;i++){
        let th = document.createElement("th");
        th.classList.add("head");
        th.appendChild(document.createTextNode(th_text[i]));
        tr.appendChild(th);
    };
    thead.appendChild(tr);
    consume_info_table.appendChild(thead);
    let tbody = document.createElement("tbody");
    tbody.classList.add("consume-info-body");
    let consume_tr = document.createElement("tr");
    consume_tr.classList.add("consume-info");
    let td_p = document.createElement("td");
    td_p.classList.add("consume-p");
    td_p.appendChild(document.createTextNode("0"));
    let td_f = document.createElement("td");
    td_f.classList.add("consume-f");
    td_f.appendChild(document.createTextNode("0"));
    let td_c = document.createElement("td");
    td_c.classList.add("consume-c");
    td_c.appendChild(document.createTextNode("0"));
    let td_calo = document.createElement("td");
    td_calo.classList.add("consume-calo");
    td_calo.appendChild(document.createTextNode("0"));
    consume_tr.appendChild(td_p);
    consume_tr.appendChild(td_f);
    consume_tr.appendChild(td_c);
    consume_tr.appendChild(td_calo);
    tbody.appendChild(consume_tr);
    consume_info_table.appendChild(tbody);
    consume_info_box.appendChild(consume_info_table);
    //button section
    let btn_div = document.createElement("div");
    btn_div.classList.add("send-btn-container");
    let submit_btn = document.createElement("span");
    submit_btn.classList.add("send-add-search");
    submit_btn.innerHTML = "Add";
    submit_btn.addEventListener("click",function(){ //register add new food event 
        //check before submit
        let result = true;
        let consume_protein = Number(document.querySelector(".consume-p").textContent);
        let consume_fat = Number(document.querySelector(".consume-f").textContent);
        let consume_carbs = Number(document.querySelector(".consume-c").textContent);
        let consume_calo = Number(document.querySelector(".consume-calo").textContent);
        let input_amount = document.getElementById("food_portion")
        let search_result = document.querySelector(".search-result");
        let input_food = document.getElementById("food_name");
        if(td_p==="0" && td_f==="0" && td_c==="0"){ //can't be three 0
            result = false;
        }else if(select_food["name"]==="null" || !input_amount.value || !Number(input_amount.value) || search_result || !input_food.value){
            result = false;
        };
        if(result){  //submit
            select_food["calories"] = consume_calo;
            let payload = {
                "create_at" : on_date_utc,
                "record_id" : record_id,
                "food_name" : select_food["food_name"],
                "protein" : consume_protein,
                "fat" : consume_fat,
                "carbs" : consume_carbs,
                "amount" : Number(Number(input_amount.value).toFixed(1))
            }            
            let promise = add_intake(JSON.stringify(payload),"search");
            promise.then((result)=>{
                //clear out
                let input_amount = document.getElementById("food_portion")
                let input_food = document.getElementById("food_name");
                input_amount.value="";
                input_food.value="";
                let l = [".consume-p",".consume-f",".consume-c",".consume-calo"];
                for(let i = 0;i<l.length;i++){
                let td = document.querySelector(l[i]);
                td.innerHTML="0";
                };
            }).catch((msg)=>{
                console.log(msg);
            });
        }else{ 
            let message = "Please confirm input is completed.";
            console.log(message);
            //show_reminder(message); 
        };                   
    });
    let close_btn = document.createElement("span");
    close_btn.classList.add("close-add-search");
    close_btn.innerHTML = "Close";
    close_btn.addEventListener("click",function(){ //close update window
        //close box
        document.body.classList.toggle("stop-scrolling");
        let bg = document.getElementsByClassName('bg');
        document.body.removeChild(bg[0]);
        //select_food back to null
        select_food={"food_name":null,
                 "food_id":null, 
                 "protein":null,
                 "carbs":null,
                 "fat":null, 
                 "calories":null}
    });
    btn_div.appendChild(close_btn);
    btn_div.appendChild(submit_btn);
    consume_info_box.appendChild(btn_div);
    search_food_box.appendChild(consume_info_box);
    background.appendChild(search_food_box);
    return background;
};


function show_tip_directly(message){
    let tip = document.getElementById("directly-tip");
    if(tip){
        tip.remove();
    };
    let close_btn = document.querySelector(".close-directly");
    let tip_span = document.createElement("span");
    tip_span.id="directly-tip";
    tip_span.appendChild(document.createTextNode(message));
    close_btn.before(tip_span);
};


function validate_input_directly(){
    let result = true;
    let food_name = document.getElementsByName("directly-food-name")[0].value;
    let input_food_amount = document.getElementsByName("input-food-amount")[0].value;
    let input_food_protein = document.getElementsByName("input-food-protein")[0].value;
    let input_food_fat = document.getElementsByName("input-food-fat")[0].value;
    let input_food_carbs = document.getElementsByName("input-food-carbs")[0].value;
    if(!food_name || !input_food_amount || !input_food_protein || !input_food_fat || !input_food_carbs){
        show_tip_directly("Please enter each blank.");
        result = false;
        return result;
    }else if(typeof(Number(input_food_amount))!=="number" || typeof(Number(input_food_protein))!=="number" || typeof(Number(input_food_fat))!=="number" || typeof(Number(input_food_carbs))!=="number"){
        show_tip_directly("Please enter a valid value.");
        result = false;
        return result;
    }else if(Number(input_food_amount)<0 || Number(input_food_protein)<0 || Number(input_food_fat)<0 || Number(input_food_carbs)<0){
        show_tip_directly("Please enter a non-negative value.");
        result = false;
        return result;
    }else if(Number(input_food_amount)===0){
        show_tip_directly("Amount must be > 0.");
        result = false;
        return result;
    }else if(Number(input_food_fat)+Number(input_food_protein)+Number(input_food_carbs)===0){
        show_tip_directly("Protein + fat + carbs must be > 0.");
        result = false;
        return result;
    }else{    
        return result;
    } ;   
};



function pop_input_directly(background){
    let directly_box = document.createElement("div");
    directly_box.classList.add("input-directly-box");
    let input_directly_form = document.createElement("form");
    input_directly_form.classList.add("input-directly-form");
    let title_div = document.createElement("div");
    title_div.classList.add("input-directly-title");
    title_div.innerHTML = "Input information about what you've eaten directly."
    //fill in food name
    let fill_food_name = document.createElement("div");
    fill_food_name.classList.add("directly-food-name");
    fill_food_name.classList.add("fill");
    let span1 = document.createElement("span");
    span1.classList.add("directly-title");
    span1.innerHTML = "Food name :";
    let input_food_name = document.createElement("input");
    input_food_name.setAttribute("type","text");
    input_food_name.setAttribute("name","directly-food-name");
    fill_food_name.appendChild(span1);
    fill_food_name.appendChild(input_food_name);
    //fill food amount
    let fill_food_amount = document.createElement("div");
    fill_food_amount.classList.add("fill-food-amount");
    fill_food_amount.classList.add("fill");
    let span2 = document.createElement("span");
    span2.classList.add("directly-title");
    span2.innerHTML = "Amount :";
    let input_food_amount = document.createElement("input");
    input_food_amount.setAttribute("type","number");
    input_food_amount.setAttribute("step","0.1");
    input_food_amount.setAttribute("min","0");
    input_food_amount.setAttribute("name","input-food-amount");
    let span2_1 = document.createElement("span");
    span2_1.innerHTML="g";
    fill_food_amount.appendChild(span2);
    fill_food_amount.appendChild(input_food_amount);
    fill_food_amount.appendChild(span2_1);
    //fill in protein
    let fill_food_protein = document.createElement("div");
    fill_food_protein.classList.add("fill-food-protein");
    fill_food_protein.classList.add("fill");
    let span3 = document.createElement("span");
    span3.classList.add("directly-title");
    span3.innerHTML = "Protein :";
    let input_food_protein = document.createElement("input");
    input_food_protein.setAttribute("type","number");
    input_food_protein.setAttribute("step","0.1");
    input_food_protein.setAttribute("min","0");
    input_food_protein.setAttribute("name","input-food-protein");
    input_food_protein.addEventListener("input",function(){
        let cal = document.getElementById("caculate-food-calo");
        let f = document.getElementsByName("input-food-fat")[0].value;
        let c = document.getElementsByName("input-food-carbs")[0].value;
        let value = this.value;
        if(!f || typeof(Number(f))!== "number" || Number(f)<0){
            f = 0;
        }else{
            f = Number(Number(f).toFixed(1))*9
        };
        if(!c || typeof(Number(c))!== "number" || Number(c)<0){
            c = 0;
        }else{
            c = Number(Number(c).toFixed(1))*4
        };
        if(typeof(Number(value))==="number" && Number(value)>=0){
            cal.innerHTML = String( Math.round(Number(Number(value).toFixed(1))*4 + f + c) );
        }else{
            cal.innerHTML = String(Math.round(0 + f + c));
        };
    });
    let span3_1 = document.createElement("span");
    span3_1.innerHTML="g";
    fill_food_protein.appendChild(span3);
    fill_food_protein.appendChild(input_food_protein);
    fill_food_protein.appendChild(span3_1);
    //fill in fat
    let fill_food_fat = document.createElement("div");
    fill_food_fat.classList.add("fill-food-fat");
    fill_food_fat.classList.add("fill");
    let span4 = document.createElement("span");
    span4.classList.add("directly-title");
    span4.innerHTML = "Fat :";
    let input_food_fat = document.createElement("input");
    input_food_fat.setAttribute("type","number");
    input_food_fat.setAttribute("step","0.1");
    input_food_fat.setAttribute("min","0");
    input_food_fat.setAttribute("name","input-food-fat");
    input_food_fat.addEventListener("input",function(){
        let cal = document.getElementById("caculate-food-calo");
        let p = document.getElementsByName("input-food-protein")[0].value;
        let c = document.getElementsByName("input-food-carbs")[0].value;
        let value = this.value;
        if(!p || typeof(Number(p))!== "number" || Number(p)<0){
            p = 0;
        }else{
            p = Number(Number(p).toFixed(1))*4
        };
        if(!c || typeof(Number(c))!== "number" || Number(c)<0){
            c = 0;
        }else{
            c = Number(Number(c).toFixed(1))*4
        };
        if(typeof(Number(value))==="number" && Number(value)>=0){
            cal.innerHTML = String( Math.round(Number(Number(value).toFixed(1))*9 + p + c) );
        }else{
            cal.innerHTML = String(Math.round(0 + p + c));
        }
    });
    let span4_1 = document.createElement("span");
    span4_1.innerHTML="g";
    fill_food_fat.appendChild(span4);
    fill_food_fat.appendChild(input_food_fat);
    fill_food_fat.appendChild(span4_1);
    //fill in carbs
    let fill_food_carbs = document.createElement("div");
    fill_food_carbs.classList.add("fill-food-carbs");
    fill_food_carbs.classList.add("fill");
    let span5 = document.createElement("span");
    span5.classList.add("directly-title");
    span5.innerHTML = "Carbs :";
    let input_food_carbs = document.createElement("input");
    input_food_carbs.setAttribute("type","number");
    input_food_carbs.setAttribute("step","0.1");
    input_food_carbs.setAttribute("min","0");
    input_food_carbs.setAttribute("name","input-food-carbs");
    input_food_carbs.addEventListener("input",function(){
        let cal = document.getElementById("caculate-food-calo");
        let p = document.getElementsByName("input-food-protein")[0].value;
        let f = document.getElementsByName("input-food-fat")[0].value;
        let value = this.value;
        if(!p || typeof(Number(p))!== "number" || Number(p)<0){
            p = 0;
        }else{
            p = Number(Number(p).toFixed(1))*4
        };
        if(!f || typeof(Number(f))!== "number" || Number(f)<0){
            f = 0;
        }else{
            f = Number(Number(f).toFixed(1))*9
        };
        if(typeof(Number(value))==="number" && Number(value)>=0){
            cal.innerHTML = String( Math.round(Number(Number(value).toFixed(1))*4 + p + f));
        }else{
            cal.innerHTML = String( Math.round(0 + p + f));
        }
    });
    let span5_1 = document.createElement("span");
    span5_1.innerHTML="g";
    fill_food_carbs.appendChild(span5);
    fill_food_carbs.appendChild(input_food_carbs);
    fill_food_carbs.appendChild(span5_1);
    //show calories
    let show_food_calo = document.createElement("div");
    show_food_calo.classList.add("show-food-calo");
    show_food_calo.classList.add("fill");
    let span6 = document.createElement("span");
    span6.classList.add("directly-title");
    span6.innerHTML = "Calories :";
    let span6_1 = document.createElement("span");
    span6_1.id = "caculate-food-calo";
    span6_1.appendChild(document.createTextNode("0"));
    let span6_2 = document.createElement("span");
    span6_2.innerHTML="kcal";
    show_food_calo.appendChild(span6);
    show_food_calo.appendChild(span6_1);
    show_food_calo.appendChild(span6_2);
    //button
    let btn_div = document.createElement("div");
    btn_div.classList.add("directly-btn-box");
    let submit_btn = document.createElement("span");
    submit_btn.classList.add("submit-directly");
    submit_btn.innerHTML = "Add";
    submit_btn.addEventListener("click",function(){ //register input directly event 
        //check all data before submit
        let validate = validate_input_directly();
        if(validate){
            let food_name = document.getElementsByName("directly-food-name")[0].value;
            let input_food_amount = document.getElementsByName("input-food-amount")[0].value;
            let input_food_protein = document.getElementsByName("input-food-protein")[0].value;
            let input_food_fat = document.getElementsByName("input-food-fat")[0].value;
            let input_food_carbs = document.getElementsByName("input-food-carbs")[0].value;
            let payload = {
                "create_at" : on_date_utc,
                "record_id" : record_id,
                "food_name" : food_name,
                "protein" : Number(Number(input_food_protein).toFixed(1)),
                "fat" : Number(Number(input_food_fat).toFixed(1)),
                "carbs" : Number(Number(input_food_carbs).toFixed(1)),
                "amount" : Number(Number(input_food_amount).toFixed(1))
            };           
            let promise = add_intake(JSON.stringify(payload),"directly");
            promise.then((result)=>{
                let calories = Number(document.getElementById("caculate-food-calo").textContent);
                let current_calories = document.querySelector(".current-calo");
                let new_calories = Number(current_calories.textContent)+calories;
                current_calories.innerHTML = String(new_calories);
                //claer out
                document.getElementsByName("directly-food-name")[0].value="";
                document.getElementsByName("input-food-amount")[0].value="";
                document.getElementsByName("input-food-protein")[0].value="";
                document.getElementsByName("input-food-fat")[0].value="";
                document.getElementsByName("input-food-carbs")[0].value="";
                document.getElementById("caculate-food-calo").innerHTML="0";
                //take off tip
                let tip = document.getElementById("directly-tip");
                if(tip){
                    tip.remove();
                };
            }).catch((msg)=>{
                console.log(msg)
            });
        };        
    });
    let close_btn = document.createElement("span");
    close_btn.classList.add("close-directly");
    close_btn.innerHTML = "Close";
    close_btn.addEventListener("click",function(){ //colse update window
        document.body.classList.toggle("stop-scrolling");
        let bg = document.getElementsByClassName('bg');
        document.body.removeChild(bg[0]);
    });
    btn_div.appendChild(close_btn);
    btn_div.appendChild(submit_btn);
    let break_div = document.createElement("div");
    break_div.classList.add("break");
    input_directly_form.appendChild(title_div);
    input_directly_form.appendChild(break_div)
    input_directly_form.appendChild(fill_food_name);
    input_directly_form.appendChild(fill_food_amount);
    input_directly_form.appendChild(fill_food_protein);
    input_directly_form.appendChild(fill_food_fat);
    input_directly_form.appendChild(fill_food_carbs);
    input_directly_form.appendChild(show_food_calo);
    input_directly_form.appendChild(btn_div);
    directly_box.appendChild(input_directly_form);
    background.appendChild(directly_box);
    return background;
};


//render what had been eaten section
function show_consume(main_container,food_record){
    let tbody = document.querySelector(".food-body");
    //if "record-containe" already existed then don't produce 
    if(document.querySelector(".record-container") && tbody){ 
        //only change the "tr" content inside food-body(remove old ones first)
        while(tbody.firstChild){
            tbody.removeChild(tbody.firstChild);
        };
        //then put in new tr(if food_record existed)
        if(food_record){
            for(let i = 0 ; i < food_record.length ; i++){
                let tr = create_tr(food_record[i]);
                tbody.appendChild(tr);
            };
            feather.replace(); 
        };
    }else{
        let start_record = document.querySelector(".start-record");
        let get_start = document.querySelector(".get-start");
        let record_container;
        let use_main_container;
        if(start_record){
            start_record.remove();
            get_start.remove();
            record_container = document.querySelector(".record-container");
            use_main_container = false;
        }else{
            record_container = document.createElement("div");
            record_container.classList.add("record-container");
            use_main_container = true;
        };
        let left_record = document.createElement("div");
        left_record.classList.add("left-record");
        //use which action
        let action_container = document.createElement("div");
        action_container.classList.add("action-container");
        let action_title = document.createElement("span");
        action_title.classList.add("action-title");
        action_title.appendChild(document.createTextNode("Select one action to record what you've eaten."));
        //search food
        let search_food = document.createElement("div");
        search_food.classList.add("action");
        search_food.classList.add("search-food");
        let search_food_span = document.createElement("span");
        search_food_span.appendChild(document.createTextNode("Search Food"));
        search_food.appendChild(search_food_span);
        search_food.addEventListener("click",function(){  //按下search food跳出search bar
            let bg = pop_search_food(createBack());
            document.body.appendChild(bg);
        });
        // load from my food
        let load_from_food = document.createElement("div");
        load_from_food.classList.add("action");
        load_from_food.classList.add("load-from-food");
        let load_from_span = document.createElement("span");
        load_from_span.appendChild(document.createTextNode("Load from My Food"));
        load_from_food.appendChild(load_from_span); 
        load_from_span.addEventListener("click",function(){ //click to show "load form my food" box
            let bg = render_my_food_window_load(createBack());
            document.body.appendChild(bg);
        });
        // input directly
        let input_directly = document.createElement("div");
        input_directly.classList.add("action");
        input_directly.classList.add("input-directly");
        let input_directly_span = document.createElement("span");
        input_directly_span.appendChild(document.createTextNode("Input directly"));
        input_directly.appendChild(input_directly_span); 
        input_directly.addEventListener("click",function(){ //click to show "input directly" box
            let bg = pop_input_directly(createBack());
            document.body.appendChild(bg);
        });
        action_container.appendChild(action_title);
        action_container.appendChild(search_food);
        action_container.appendChild(input_directly);
        action_container.appendChild(load_from_food);
        left_record.appendChild(action_container);
        //what had benn eaten section
        let intake_record = document.createElement("div");
        intake_record.classList.add("intake-record");
        let consume_food = document.createElement("div");
        consume_food.classList.add("consume-food");
        let table = document.createElement("table");
        table.classList.add("food-table");
        let thead = document.createElement("thead");
        let tr = document.createElement("tr");
        let th_text = ["\u00A0","Protein(g)","Fat(g)","Carbs(g)","amount(g)","\u00A0"]
        for(let i=0;i<th_text.length;i++){
            let th = document.createElement("th");
            th.classList.add("head");
            th.appendChild(document.createTextNode(th_text[i]));
            tr.appendChild(th);
        };
        thead.appendChild(tr);
        table.appendChild(thead);
        let tbody = document.createElement("tbody");
        tbody.classList.add("food-body");
        if(food_record){
            for(let i = 0;i < food_record.length ; i++){
                let tr = create_tr(food_record[i]);
                tbody.appendChild(tr);
            };
        };
        table.appendChild(tbody);
        consume_food.appendChild(table);
        intake_record.appendChild(consume_food);
        left_record.appendChild(intake_record);
        record_container.appendChild(left_record);
        feather.replace();
        if(use_main_container){
            main_container.appendChild(record_container);
            feather.replace();
        };
    };
};    


function show_date(main_container,date_format){
    if(document.querySelector(".calender-container")){ //if this div already existed, no nedd to produce
        //only change date
        let show_date_div = document.querySelector(".show-date");
        show_date_div.innerHTML = date_format; 
    }else{
        let calender_container_div = document.createElement("div");
        calender_container_div.classList.add("calender-container");
        let datepicker_toggle_div = document.createElement("div");
        datepicker_toggle_div.classList.add("datepicker-toggle");
        let date_img = new Image();
        date_img.src = "https://d2fbjpv4bzz3d2.cloudfront.net/planner.png";
        date_img.classList.add("datepicker-toggle-button");
        let date_input = document.createElement("input");
        date_input.classList.add("datepicker-input");
        date_input.setAttribute("type","date");
        date_input.addEventListener("change",function(){ //register click on date event 
            if(this.value !== on_which_date){ 
                let choose_date = this.valueAsDate; //date be selected 
                let year = choose_date.getFullYear(); 
                let month = choose_date.getMonth()  
                let date = choose_date.getDate();   
                let show_date_format = Month[month+1] + " "+String(date) + ", " + String(year); //date be showed on screen
                let new_date = new Date(year,month,date);
                let utc = new_date.getTime();
                if(month<10){
                    on_which_date = String(year) + "-" + "0" + String(month+1)+"-";
                }else{
                    on_which_date = String(year) + "-" +String(month+1)+"-";
                };
                if(date < 10){
                    on_which_date = on_which_date + "0" + String(date);
                }else{
                    on_which_date = on_which_date + String(date);
                };
                on_date_utc = utc; //record global variable for timestamp
                on_date_format = show_date_format; //record global variable for showing format
                get_record(utc,show_date_format);
            };
        });
        datepicker_toggle_div.appendChild(date_img);
        datepicker_toggle_div.appendChild(date_input);
        let show_date_div = document.createElement("div");
        show_date_div.classList.add("show-date");
        show_date_div.appendChild(document.createTextNode(date_format));
        calender_container_div.appendChild(datepicker_toggle_div);
        calender_container_div.appendChild(show_date_div);
        daily_title_div = document.createElement("div");
        daily_title_div.classList.add("daily-title");
        daily_title_div.appendChild(document.createTextNode("Daily Record"));
        calender_container_div.appendChild(daily_title_div);
        main_container.appendChild(calender_container_div);
    };    
};


//edit record
async function update_target(payload,jwt){
    try{
        let response = await fetch('/api/records',{
                                     method: 'PATCH',
                                     body : payload,
                                     headers: {"Authorization" : `Bearer ${jwt}`,'Content-Type': 'application/json'}
                                    });
        let result = await response.json();                            
        if(response.ok){ 
            let payload_obj = JSON.parse(payload);
            new_target_calories = payload_obj["plan_calories"];
            new_target_protein =  payload_obj["protein"];
            new_target_fat =  payload_obj["fat"];
            new_target_carbs =  payload_obj["carbs"];
            document.body.classList.toggle("stop-scrolling");
            let bg = document.getElementsByClassName('bg');
            document.body.removeChild(bg[0]);
            //update showing target
            let plan_calo = document.querySelector(".plan-calo")
            plan_calo.innerHTML =  new_target_calories;
            //target protein
            let plan_protein = document.querySelector(".plan-protein")
            let plan_p_g = "~"+String(Math.round((new_target_calories*new_target_protein/100)/4))+"g"
            plan_protein.innerHTML = plan_p_g;
            let percent_protein = document.querySelector(".percent-protein");
            percent_protein.innerHTML =  "("+String(new_target_protein)+"%"+")";
            //target carbs
            let plan_carbs = document.querySelector(".plan-carbs")
            let plan_c_g = "~"+String(Math.round((new_target_calories*new_target_carbs/100)/4))+"g"
            plan_carbs.innerHTML = plan_c_g;
            let percent_carbs = document.querySelector(".percent-carbs");
            percent_carbs.innerHTML =  "("+String(new_target_carbs)+"%"+")";
            //target fat
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
        };
    }catch(message){
        console.log(`${message}`)
        throw Error('Fetching was not ok!!.')
    } ;   
};    


//verufy update target data
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
        };
        result = false;
        return result;
    }
    return result    
};


//organize update target data , call update record API
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
        };
    };
    data["record_id"] = record_id;
    data["create_at"] = on_date_utc;
    return JSON.stringify(data);
}



//create background(let the screen un-scroll)
function createBack(){
    document.body.classList.toggle("stop-scrolling");
    let background = document.createElement("div");
    background.className = "bg";
    return background;
};


//pop out editing window 
function pop_edit_window(background){
    let edit_box = document.createElement("div");
    edit_box.classList.add("edit-box");
    let edit_form = document.createElement("form");
    edit_form.classList.add("edit-form");
    let title_div = document.createElement("div");
    title_div.classList.add("edit-title");
    title_div.innerHTML = "Edit your nutrition target"
    //reminder
    let remider_div = document.createElement("div");
    remider_div.classList.add("update-remind");
    remider_div.innerHTML = "Percentages (Must add to 100%)";
    //fill in calories
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
    //fill in protein
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
    //fill in fat
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
    //fill in carbs
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
    //button
    let btn_div = document.createElement("div");
    btn_div.classList.add("update-btn");
    let submit_btn = document.createElement("span");
    submit_btn.classList.add("submit-update");
    submit_btn.innerHTML = "Save change";
    submit_btn.addEventListener("click",function(){ //register update target event
        //check data before submit
        let validate = validate_target_update();
        if(validate){
            let jwt = localStorage.getItem("JWT");
            let json_data = organize_target_update();
            update_target(json_data,jwt);
        };        
    });
    let close_btn = document.createElement("span");
    close_btn.classList.add("close-update");
    close_btn.innerHTML = "Close";
    close_btn.addEventListener("click",function(){ 
        document.body.classList.toggle("stop-scrolling");
        let bg = document.getElementsByClassName('bg');
        document.body.removeChild(bg[0]);
    });
    btn_div.appendChild(close_btn);
    btn_div.appendChild(submit_btn);
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
};



function show_pfcc_section(right_record,day_record,food_record){
    let plan_nutrition = document.createElement("div");
    plan_nutrition.classList.add("plan-nutrition");
    let current_status = document.createElement("div");
    current_status.classList.add("current-status");
    let planned = document.createElement("div");
    planned.classList.add("planned");
    //current status
    let current_title = document.createElement("div");
    current_title.classList.add("current-title");
    current_title.innerHTML = "CURRENT STATUS";
    //current status-calories
    let current_calories = document.createElement("div");
    current_calories.classList.add("current");
    current_calories.classList.add("current-calories");
    let span_calories = document.createElement("span");
    span_calories.classList.add("nutri_name");
    span_calories.innerHTML = "Calories";
    current_calories.appendChild(span_calories);
    //current status-protein
    let current_protein = document.createElement("div");
    current_protein.classList.add("current");
    current_protein.classList.add("current-protein");
    let span_protein = document.createElement("span");
    span_protein.classList.add("nutri_name");
    span_protein.innerHTML = "Protein";
    current_protein.appendChild(span_protein);
    //current status-carbs
    let current_carbohydrate = document.createElement("div");
    current_carbohydrate.classList.add("current");
    current_carbohydrate.classList.add("current-carbohydrate");
    let span_carb = document.createElement("span");
    span_carb.classList.add("nutri_name");
    span_carb.innerHTML = "Carbs";
    current_carbohydrate.appendChild(span_carb);
    //current status-fat
    let current_fat = document.createElement("div");
    current_fat.classList.add("current");
    current_fat.classList.add("current-fat");
    let span_fat = document.createElement("span");
    span_fat.classList.add("nutri_name");
    span_fat.innerHTML = "Fat";
    current_fat.appendChild(span_fat);
    //current status-calories
    let current_calo = document.createElement("span");
    current_calo.classList.add("current-calo");
    let current_p = document.createElement("span");
    current_p.classList.add("current-protein_g");
    let current_c = document.createElement("span");
    current_c.classList.add("current-carbs_g");
    let current_f = document.createElement("span");
    current_f.classList.add("current-fat_g");//
    if(food_record){ //if food record existed
        let protein=0;
        let fat=0;
        let carbs=0;
        let calories=0;
        for(let i=0;i<food_record.length;i++){
            protein+=food_record[i]["protein"];
            fat+=food_record[i]["fat"];
            carbs+=food_record[i]["carbs"];
        };
        calories = Math.round((protein*4)+(fat*9)+(carbs*4)) 
        protein = protein.toFixed(1)+"g"
        carbs = carbs.toFixed(1)+"g";
        fat = fat.toFixed(1)+"g";
        current_calo.innerHTML = calories;
        current_p.innerHTML = protein;
        current_c.innerHTML = carbs;
        current_f.innerHTML = fat;
    }else{
        let protein="0"+"g";
        let fat="0"+"g";
        let carbs="0"+"g";
        let calories="0";
        current_calo.innerHTML = calories;
        current_p.innerHTML = protein;
        current_c.innerHTML = carbs;
        current_f.innerHTML = fat;
    };
    current_calories.appendChild(current_calo);
    current_protein.appendChild(current_p);
    current_carbohydrate.appendChild(current_c);
    current_fat.appendChild(current_f);
    //target-title
    let target_title =  document.createElement("div");
    target_title.classList.add("target-title");
    let target_span = document.createElement("span");
    target_span.innerHTML="Target";
    let edit_span = document.createElement("span");
    edit_span.classList.add("edit-button");
    edit_span.innerHTML = "Edit";
    edit_span.addEventListener("click",function(){ //click on edit target event, pop out window 
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
};

//show pie chart
function show_chart_section(right_record,day_record,food_record){
    let chart_div = document.createElement("div");
    chart_div.classList.add("chart");
    let pie_div = document.createElement("div");
    pie_div.setAttribute("id","pie");
    let canvas = document.createElement("canvas");
    canvas.setAttribute("id","pfc");
    let pie = canvas.getContext("2d");
    let protein_amount=0;
    let fat_amount=0;
    let carbs_amount=0;
    if(food_record){
        for(let i=0;i<food_record.length;i++){
            protein_amount+=food_record[i]["protein"];
            fat_amount+=food_record[i]["fat"];
            carbs_amount+=food_record[i]["carbs"];
        };
        let total_amount = protein_amount*4+fat_amount*9+carbs_amount*4;
        let percentage_p = Math.round(protein_amount*4/total_amount*100);
        let percentage_f = Math.round(fat_amount*9/total_amount*100);
        let percentage_c = 100 - percentage_p - percentage_f;
        group.amount[0] = percentage_p;
        group.amount[1] = percentage_c;
        group.amount[2] = percentage_f;
        let PieChart = new Chart(pie,{type:'pie',data:DataEC, options: {plugins:optionsEC}});
    }else{//no pie chart
        group.amount[0] = 0;
        group.amount[1] = 0;
        group.amount[2] = 0;
        let PieChart = new Chart(pie,{type:'pie',data:DataEC, options: {plugins:optionsEC}});
    };
    pie_div.appendChild(canvas);
    chart_div.appendChild(pie_div);   
    right_record.appendChild(chart_div);
};



function show_right_section(record_container,day_record,food_record){
    if(document.querySelector(".right-record")){ //if right-record existed
        //only update current status : calories,protein,carbs,fat
        let current_calo = document.querySelector(".current-calo");
        let current_p = document.querySelector(".current-protein_g");
        let current_c = document.querySelector(".current-carbs_g");
        let current_f = document.querySelector(".current-fat_g");
        if(food_record){ 
            let protein=0;
            let fat=0;
            let carbs=0;
            let calories=0;
            for(let i=0;i<food_record.length;i++){
                protein+=food_record[i]["protein"];
                fat+=food_record[i]["fat"];
                carbs+=food_record[i]["carbs"];
            };
            calories = Math.round((protein*4)+(fat*9)+(carbs*4)) 
            protein = protein.toFixed(1)+"g"
            carbs = carbs.toFixed(1)+"g";
            fat = fat.toFixed(1)+"g";
            current_calo.innerHTML = calories;
            current_p.innerHTML = protein;
            current_c.innerHTML = carbs;
            current_f.innerHTML = fat;
        }else{ 
            let protein="0"+"g";
            let fat="0"+"g";
            let carbs="0"+"g";
            let calories="0";
            current_calo.innerHTML = calories;
            current_p.innerHTML = protein;
            current_c.innerHTML = carbs;
            current_f.innerHTML = fat;
        };
        //only update target : calories,protein,carbs,fat
        let plan_calo = document.querySelector(".plan-calo"); 
        plan_calo.innerHTML = day_record["plan_calories"];
        let plan_p = document.querySelector(".plan-protein");
        let plan_p_g = "~"+String(Math.round((day_record["plan_calories"]*day_record["protein"]/100)/4))+"g"
        plan_p.innerHTML = plan_p_g;
        let percent_protein = document.querySelector(".percent-protein")
        percent_protein.innerHTML = "("+String(day_record["protein"])+"%"+")";
        let plan_c = document.querySelector(".plan-carbs");
        let plan_c_g = "~"+String(Math.round((day_record["plan_calories"]*day_record["carbs"]/100)/4))+"g"
        plan_c.innerHTML = plan_c_g;
        let percent_carbs = document.querySelector(".percent-carbs")
        percent_carbs.innerHTML = "("+String(day_record["carbs"])+"%"+")";
        let plan_f = document.querySelector(".plan-fat");
        let plan_f_g = "~"+String(Math.round((day_record["plan_calories"]*day_record["fat"]/100)/9))+"g"
        plan_f.innerHTML = plan_f_g;
        let percent_fat = document.querySelector(".percent-fat")
        percent_fat.innerHTML = "("+String(day_record["fat"])+"%"+")";
        //only update pie 
        let canvas = Chart.getChart("pfc");
        canvas.destroy();
        let pie = document.getElementById("pfc").getContext("2d");
        let protein_amount=0;
        let fat_amount=0;
        let carbs_amount=0;
        if(food_record){
            for(let i=0;i<food_record.length;i++){
                protein_amount+=food_record[i]["protein"];
                fat_amount+=food_record[i]["fat"];
                carbs_amount+=food_record[i]["carbs"];
            };
            let total_amount = protein_amount*4+fat_amount*9+carbs_amount*4;
            let percentage_p = Math.round(protein_amount*4/total_amount*100);
            let percentage_f = Math.round(fat_amount*9/total_amount*100);
            let percentage_c = 100 - percentage_p - percentage_f;
            group.amount[0] = percentage_p;
            group.amount[1] = percentage_c;
            group.amount[2] = percentage_f;
            let PieChart = new Chart(pie,{type:'pie',data:DataEC, options: {plugins:optionsEC}});
        }else{ // no pie
            group.amount[0] = 0;
            group.amount[1] = 0;
            group.amount[2] = 0;
            let PieChart = new Chart(pie,{type:'pie',data:DataEC, options: {plugins:optionsEC}});
        };
    }else{
        let right_record = document.createElement("div");
        right_record.classList.add("right-record");
        // put right-record in chart and pfc function
        show_chart_section(right_record,day_record,food_record);
        show_pfcc_section(right_record,day_record,food_record);
        record_container.appendChild(right_record);
    };
};


//跳出deit plan框框給使用者選擇載入
function pop_load_diet_plan(background){
    let load_plan_box = document.createElement("div");
    load_plan_box.classList.add("load-plan-box");
    let load_plan = document.createElement("div");
    load_plan.classList.add("load-plan");
    //小title
    let title_div = document.createElement("div");
    title_div.classList.add("edit-title");
    let span1 = document.createElement("span");
    span1.classList.add("load-plan-title");
    span1.innerHTML="Choose a diet plan to load in this day.";
    let span2 = document.createElement("span");
    span2.classList.add("load-plan-title");
    span2.innerHTML="If there is no diet plan available.";
    let span3 = document.createElement("span");
    span3.classList.add("load-plan-title");
    span3.innerHTML="Please create a diet plan first or create a default plan.";
    title_div.appendChild(span1);
    title_div.appendChild(span2);
    title_div.appendChild(span3);
    //分隔線
    let break_line = document.createElement("div");
    break_line.classList.add("break");
    //飲食計畫
    let diet_plan = document.createElement("div");
    diet_plan.classList.add("diet-plan");//
    diet_plan.addEventListener("scroll",function(){ //plan table註冊滑動載入my-plan事件
        if(this.scrollHeight-this.scrollTop <= this.clientHeight){
            if(can_get_my_plan && my_plan_page){
                can_get_my_plan = false;
                get_diet_plan(my_plan_page,"forload");
            };
        };
    });
    let table = document.createElement("table");
    table.classList.add("plan-table");
    let thead = document.createElement("thead");
    let tr = document.createElement("tr");
    let th_text = ["\u00A0","Protein(%)","Fat(%)","Carbs(%)","Calories(kcal)"]
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
    get_diet_plan(my_plan_page,"forload"); //取得飲食計畫 ,先傳入預設0的my_plan_page
    table.appendChild(tbody);
    //add loading effect first
    let svg = generate_loading();
    table.appendChild(svg);
    diet_plan.appendChild(table);
    //
    load_plan.appendChild(title_div);
    load_plan.appendChild(break_line);
    load_plan.appendChild(diet_plan);
    //
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
        select_diet_plan_id = null;
        my_plan_page = 0;
        can_get_my_plan = true;
    });
    let span_select = document.createElement("span");
    span_select.classList.add("submit-select");
    span_select.innerHTML="Load";
    span_select.addEventListener("click",function(){ //送出選擇的plan 打/records POST
        //先檢查有沒有選diet plan,如果沒選跳出提示訊息
        if(!select_diet_plan_id){
            let span_cancel = document.querySelector(".cancel-select");
            let reminder_span = document.createElement("span");
            reminder_span.innerHTML = "Please select a meal plan";
            reminder_span.classList.add("reminder-select");
            span_cancel.before(reminder_span);
        }else{ //有選才送出
            let jwt = localStorage.getItem("JWT");
            let payload={};
            let selected = document.getElementById(select_diet_plan_id);
            let selected_children = selected.children;
            let info=["protein","fat","carbs","plan_calories"];
            for(let i=0;i<info.length;i++){
                payload[info[i]] = Number(selected_children[i+1].textContent);
            };
            //這邊不行重新又再產生日期,要直接去抓全域變數的日期
            payload["create_at"]=on_date_utc;
            payload = JSON.stringify(payload);
            console.log(payload);
            post_select_plan(payload,jwt,on_date_format);
            can_get_my_plan = false;
        }
    });
    select_btn.appendChild(span_cancel);
    select_btn.appendChild(span_select);
    //
    load_plan.appendChild(select_btn);
    //
    load_plan_box.appendChild(load_plan);
    background.appendChild(load_plan_box);
    return background;
}

//click on load from diet plan
async function get_diet_plan(plan_page,purpose){ 
    let jwt = localStorage.getItem("JWT");
    try{
        let response = await fetch(`/api/plans?page=${plan_page}`,{
                                                method: 'get',
                                                headers: {"Authorization" : `Bearer ${jwt}`}
                                                });
        let result = await response.json();                                
        if(response.ok){  //get memebr's diet plan
            let spinner = document.querySelector(".spinner");
            if(spinner){
                spinner.remove();
            }; 
            let tbody = document.querySelector(".plan-body");
            let plans = result.plans;
            if(plans.length!==0){
                for(let i = 0;i<plans.length; i++){
                    let tr;
                    if(purpose === "forload"){
                        tr = create_plan_tr_load(plans[i]);
                    }else if(purpose === "foredit"){
                        tr = create_plan_tr_edit(plans[i]);
                    };
                    tbody.appendChild(tr);
                };  
                feather.replace();      
            };
            let next_page = result["nextPage"];
            my_plan_page = next_page;    
            can_get_my_plan = true;
        }else if(response.status === 403){ 
            console.log('JWT已失效,請重新登入');
            localStorage.removeItem("JWT");
            window.location.href = '/';
        }else if(response.status === 500){ 
            console.log(result);
        };
    }catch(message){
        console.log(`${message}`)
        throw Error('Fetching was not ok!!.')
    }; 

};


async function post_select_plan(payload,jwt,date_format){ 
    try{
        let response = await fetch('/api/records',{
                                     method: 'post',
                                     body : payload,
                                     headers: {"Authorization" : `Bearer ${jwt}`,'Content-Type': 'application/json'}
                                    });
        let result = await response.json();                            
        if(response.status === 201){ 
            let bg = document.getElementsByClassName('bg');
            if(bg[0]){
                document.body.classList.toggle("stop-scrolling");
                document.body.removeChild(bg[0]); 
            }; 
            //re-render record section
            let timestamp = JSON.parse(payload)["create_at"];
            get_record(timestamp,date_format);
            // set back
            can_get_my_plan = true;
            my_plan_page = 0;
        }else if (response.status === 403){
            console.log('JWT已失效,請重新登入');
            localStorage.removeItem("JWT");
            window.location.href = '/';
        }else if (response.status === 400){
            console.log(result);
        }else if(response.status === 500){ //如果是500,代表伺服器(資料庫)內部錯誤
            console.log(result);
        };
    }catch(message){
        console.log(`${message}`)
        throw Error('Fetching was not ok!!.')
    }    
}



function create_blank_content(){ //used in show_empty
    let start_record = document.createElement("div"); 
    start_record.classList.add("start-record");
    let start_box = document.createElement("div"); 
    start_box.classList.add("start-box"); 
    let contain = document.createElement("div"); 
    contain.classList.add("contain"); 
    let start_title = document.createElement("div"); 
    start_title.setAttribute("id","start-title");
    start_title.appendChild(document.createTextNode("No plan on this day yet."));
    let from_plan = document.createElement("div"); 
    from_plan.setAttribute("id","from-plan");
    from_plan.appendChild(document.createTextNode("Load from your diet plan"));
    from_plan.addEventListener("click",function(){  //load from plan event
        let bg = pop_load_diet_plan(createBack());
        document.body.appendChild(bg);
    });
    let from_scratch = document.createElement("div"); //
    from_scratch.setAttribute("id","from-scratch");
    from_scratch.appendChild(document.createTextNode("Create a default plan"));
    from_scratch.addEventListener("click",function(){ //add default plan
        let jwt = localStorage.getItem("JWT");
        let payload={};
        payload["plan_calories"] = 2000; //default 40 30 30  2000kcals
        payload["protein"]=30;
        payload["carbs"]=40;
        payload["fat"]=30;
        //take gloabl variables
        payload["create_at"]=on_date_utc;
        payload = JSON.stringify(payload);
        post_select_plan(payload,jwt,on_date_format);
    });
    contain.appendChild(start_title);
    contain.appendChild(from_plan);
    contain.appendChild(from_scratch);
    start_box.appendChild(contain);
    start_record.appendChild(start_box);
    return start_record;    
};


function show_empty(){
    if(document.querySelector(".record-container")){ //if record-container existed 
        let record_container = document.querySelector(".record-container");
        //only check if left-record and right-record,if existed then take off and show(趕緊新增計畫喔)
        let left = document.querySelector(".left-record");
        let right = document.querySelector(".right-record");
        if(left && right){
            left.remove();
            right.remove();
            let start_record = create_blank_content();
            //right section
            let get_start = document.createElement("div");
            get_start.classList.add("get-start");
            let gif = new Image();
            gif.src = "https://d2fbjpv4bzz3d2.cloudfront.net/point.gif";
            let start_div = document.createElement("div");
            start_div.appendChild(document.createTextNode("Let's get started !"));
            get_start.appendChild(gif);
            get_start.appendChild(start_div);
            record_container.appendChild(start_record);
            record_container.appendChild(get_start);
        }
    }else{ //means no record on that day
        let main_container = document.querySelector(".main-container");
        let record_container = document.createElement("div");
        record_container.classList.add("record-container");
        let start_record = create_blank_content();
        //right section
        let get_start = document.createElement("div");
        get_start.classList.add("get-start");
        let gif = new Image();
        gif.src = "https://d2fbjpv4bzz3d2.cloudfront.net/point.gif";
        let start_div = document.createElement("div");
        start_div.appendChild(document.createTextNode("Let's get started !"));
        get_start.appendChild(gif);
        get_start.appendChild(start_div);
        record_container.appendChild(start_record);
        record_container.appendChild(get_start);
        main_container.appendChild(record_container);
    };
};



// /api/records 
async function get_record(timestamp,show_date_format){
    let jwt = localStorage.getItem("JWT");
    try{
        let response = await fetch('/api/records?datetime='+String(timestamp),{
                                                    method: 'get',
                                                    headers: {"Authorization" : `Bearer ${jwt}`}
                                                });
        let result = await response.json();                                
        if(response.ok){  
            //1.remove loading animation
            let main_container = document.querySelector(".main-container");
            let loading = document.getElementById("loading");
            if(loading){
                main_container.removeChild(loading); 
            };
            //2.show date
            show_date(main_container,show_date_format);
            if(result["day_record"]){  //3.means have record on that day
                record_id = result["day_record"]["record_id"]
                day_record = result["day_record"];
                food_record = result["food_record"];
                show_consume(main_container,food_record);
                let record_container = document.querySelector(".record-container");
                show_right_section(record_container,day_record,food_record);
            }else{ //3.means no record
                record_id = null;
                show_empty()
            };    
        }else if(response.status === 400){ //
                showMessage(result.message,true,null);
                let mail_input = document.querySelector('.email');
                let pass_input = document.querySelector('.pass');
                mail_input.value='';
                pass_input.value=''; 
        }else if(response.status === 500){ //如果是500,代表伺服器(資料庫)內部錯誤
                showMessage(result.message,true,null);
        };
    }catch(message){
        console.log(`${message}`)
        throw Error('Fetching was not ok!!.')
    }; 
};



function render_record(user_data){
    //to server query timestamp
    let current_date = new Date();
    let year = current_date.getFullYear(); 
    let month = current_date.getMonth() 
    let date = current_date.getDate();  
    let show_date_format = Month[month+1] + " "+String(date) + ", " + String(year); 
    let new_date = new Date(year,month,date);
    let now_utc = new_date.getTime();
    if(month<10){
        on_which_date = String(year) + "-" + "0" + String(month+1)+"-";
    }else{
        on_which_date = String(year) + "-" +String(month+1)+"-";
    };
    if(date < 10){
        on_which_date = on_which_date + "0" + String(date);
    }else{
        on_which_date = on_which_date + String(date);
    };
    on_date_utc = now_utc; 
    on_date_format = show_date_format; 
    get_record(now_utc,show_date_format);
    render_sidebar(user_data); //check render side bar : id="remind" is yes or no, if no, show reminder
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