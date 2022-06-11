let my_food_page = 0;
let my_food_page_load = 0;
let can_get_my_food = true; 
let weight_action = true;
let already_on_weight_page = false; //check if on weight record page
let already_on_record_page = true; // check if on record page


async function get_member_data(){ 
    /* memebr page */
};

function render_member_page(){
     /* render memebr page */
};


function render_user_profile(navmenu,user_data){
    let user_profile = document.createElement("div");
    user_profile.classList.add("user-profile");
    let img = new Image();
    img.src = "https://d2fbjpv4bzz3d2.cloudfront.net/face.png";
    img.classList.add("profile_picture");
    let span = document.createElement("span");
    span.classList.add("username");
    span.setAttribute("memberid",user_data["member_id"]);
    span.setAttribute("identity",1);
    span.appendChild(document.createTextNode(user_data["name"]));
    span.addEventListener("click",function(){ 
        render_member_page(); 
    });
    user_profile.appendChild(img);
    user_profile.appendChild(span);
    navmenu.appendChild(user_profile);
};


function render_nutri_profile(navmenu,nutri_data){
    let user_profile = document.createElement("div");
    user_profile.classList.add("user-profile");
    let img = new Image();
    img.src = "/picture/doctor.png";
    img.classList.add("profile_picture");
    let span = document.createElement("span");
    span.classList.add("username");
    span.setAttribute("memberid",nutri_data["nutri_id"]);
    span.setAttribute("identity",2);
    span.appendChild(document.createTextNode(nutri_data["name"]));
    span.addEventListener("click",function(){ 
        render_member_page(); 
    });
    user_profile.appendChild(img);
    user_profile.appendChild(span);
    navmenu.appendChild(user_profile);
};


/* my food part  */
async function get_my_food(food_page,purpose){ //after get_my_food then render_my_food
    let jwt = localStorage.getItem("JWT");
    try{
        let response = await fetch('/api/my-food?page='+food_page,{ //origin page is 0
                                                    method: 'get',
                                                    headers: {"Authorization" : `Bearer ${jwt}`}
                                                });
        let result = await response.json();                                
        if(response.ok){  
            let tbody = document.querySelector(".my-food-body");
            let food = result["data"];
            if(food.length!==0){
                for(let i=0;i<food.length;i++){
                    let tr;
                    if(purpose==="foredit"){
                        tr = create_my_tr_edit(food[i]);
                    }else if(purpose==="forload"){
                        tr = create_my_tr_load(food[i]);
                    };
                    tbody.appendChild(tr);
                };
                feather.replace();
            }    
            let next_page = result["nextPage"];
            if(purpose==="foredit"){
                my_food_page = next_page;
            }else{
                my_food_page_load =next_page;
            };  
            can_get_my_food = true;      
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



async function delete_my_food(food_id){
    let jwt = localStorage.getItem("JWT");
    try{
        let response = await fetch('/api/my-food?food_id='+food_id,{
                                                    method: 'delete',
                                                    headers: {"Authorization" : `Bearer ${jwt}`}
                                                });                               
        if(response.status===204){  //204 
            //cal  get_my_food,set my_food_page = 0,clear out tbody
            let tbody = document.querySelector(".my-food-body");
            while(tbody.firstChild){
                tbody.firstChild.remove(); 
            };
            my_food_page = 0;
            get_my_food(my_food_page,"foredit");      
        }else if(response.status === 400){ 
            console.log("刪除失敗");
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




//my food tr(edit) 
function create_my_tr_edit(food){
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
    td_delete.setAttribute("id",food["food_id"]); //put food_id inside garbage can
    let delete_icon = document.createElement("i");
    delete_icon.setAttribute("data-feather","trash");    
    td_delete.addEventListener("click",function(){ 
        can_get_my_food = false; 
        delete_my_food(this.id);
    });
    td_delete.appendChild(delete_icon);
    tr.appendChild(th);
    tr.appendChild(td_p);
    tr.appendChild(td_f);
    tr.appendChild(td_c);
    tr.appendChild(td_delete);
    return tr;
};


//my food tr(load from my food) 
function create_my_tr_load(food){
    let tr = document.createElement("tr");
    tr.classList.add("food-item-load");
    tr.addEventListener("click",function(){ //assign to global variable select_food,change color
        const tip = document.querySelector('.tip');
        if(tip){ //if tip
            document.documentElement.style.setProperty('--color',"none");
            tip.remove();
        };
        let previous_selected = document.querySelector(".selected");
        if(previous_selected){
            previous_selected.classList.toggle("selected");
        };
        this.classList.toggle("selected"); 
        select_food["food_name"] = this.querySelector(".food-name").textContent;
        select_food["protein"] = Number(this.querySelector(".p").textContent);
        select_food["fat"] = Number(this.querySelector(".f").textContent);
        select_food["carbs"] = Number(this.querySelector(".c").textContent);
    });
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
    tr.appendChild(th);
    tr.appendChild(td_p);
    tr.appendChild(td_f);
    tr.appendChild(td_c);
    return tr;
};




async function add_food(payload,jwt){ 
    try{
        let response = await fetch('/api/my-food',{
                                     method: 'post',
                                     body : payload,
                                     headers: {"Authorization" : `Bearer ${jwt}`,'Content-Type': 'application/json'}
                                    });
        let result = await response.json();                            
        if(response.status === 201){ 
            //call get_my_food,set my_food_page = 0,clear out tbody
            let tbody = document.querySelector(".my-food-body");
            while(tbody.firstChild){
                tbody.firstChild.remove(); 
            };
            my_food_page = 0;
            get_my_food(my_food_page,"foredit");
            //clear out add food box and reminder
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



//verify add new food data 
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
    };
    return result;    
};


//organize new food data  call /my-food POST
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
        };
    };
    return JSON.stringify(data);
};




//pop out food window(for edit)
function render_my_food_window(background){
    let my_food_box = document.createElement("div");
    my_food_box.classList.add("my-food-box");
    //my food list 
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
    get_my_food(my_food_page,"foredit") 
    show_my_food.addEventListener("scroll",function(){ //my-food table register scroll loading event 
        if(this.scrollHeight-this.scrollTop <= this.clientHeight){
            if(can_get_my_food && my_food_page){
                can_get_my_food = false;
                get_my_food(my_food_page,"foredit");
            }
        };
    });
    table.appendChild(tbody);
    show_my_food.appendChild(table);
    my_food_box.appendChild(show_my_food);
    //right adding new food section
    let add_food_div = document.createElement("div");
    add_food_div.classList.add("add-food");
    let add_food_form = document.createElement("form");
    add_food_form.classList.add("add-food-form");
    let title_div = document.createElement("div");
    title_div.classList.add("add-food-title");
    title_div.innerHTML = "Add self-defined food";
    //fill in food name (must)
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
    //seperate line
    let break_div = document.createElement("div");
    break_div.classList.add("break");
    //reminder
    let remider_div = document.createElement("div");
    remider_div.classList.add("add-remind");
    remider_div.innerHTML = "Food macros (per 100g food)";
    //fill in protein
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
    //fill in fat
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
    //fill in carbs
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
    //button
    let btn_div = document.createElement("div");
    btn_div.classList.add("add-food-btn");
    let submit_btn = document.createElement("span");
    submit_btn.classList.add("submit-add-food");
    submit_btn.innerHTML = "Save change";
    submit_btn.addEventListener("click",function(){ //register add my food event event
        let validate = validate_new_food();
        if(validate){
            can_get_my_food = false; //set to false when click
            let jwt = localStorage.getItem("JWT");
            let json_data = organize_new_food();
            add_food(json_data,jwt);
        };        
    });
    let close_btn = document.createElement("span");
    close_btn.classList.add("close-add");
    close_btn.innerHTML = "Close";
    close_btn.addEventListener("click",function(){ 
        document.body.classList.toggle("stop-scrolling");
        let bg = document.getElementsByClassName('bg');
        document.body.removeChild(bg[0]);
        my_food_page = 0; 
        can_get_my_food = true;
    });
    btn_div.appendChild(close_btn);
    btn_div.appendChild(submit_btn);
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




//pop out food window (load from my food)
function render_my_food_window_load(background){
    let my_food_box = document.createElement("div");
    my_food_box.classList.add("my-food-box");
    //left: my food section
    let show_my_food = document.createElement("div");
    show_my_food.classList.add("show-my-food");
    let table = document.createElement("table");
    table.classList.add("my-food-table");
    let thead = document.createElement("thead");
    let tr = document.createElement("tr");
    let th_text = ["Food name","Protein(g)","Fat(g)","Carbs(g)"]
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
    get_my_food(my_food_page_load,"forload"); 
    show_my_food.addEventListener("scroll",function(){ 
        if(this.scrollHeight-this.scrollTop <= this.clientHeight){
            if(can_get_my_food && my_food_page_load){
                can_get_my_food = false;
                get_my_food(my_food_page_load,"forload");
            };
        };
    });
    table.appendChild(tbody);
    show_my_food.appendChild(table);
    my_food_box.appendChild(show_my_food);
    //right : input amount
    let load_amount_div = document.createElement("div");
    load_amount_div.classList.add("load-food");
    let load_food_form = document.createElement("form");
    load_food_form.classList.add("load-food-form");
    let title_div = document.createElement("div");
    title_div.classList.add("load-food-title");
    title_div.innerHTML = "Select one food and input amount";
    //fill in food amount(must)
    let load_food_amount = document.createElement("div");
    load_food_amount.classList.add("load-food-amount");
    load_food_amount.classList.add("fill");
    let span1 = document.createElement("span");
    span1.classList.add("load-title");
    span1.classList.add("load-title_amount")
    span1.innerHTML = "Amount :";
    let span1_1 = document.createElement("span");
    span1_1.innerHTML="g";
    load_food_amount.appendChild(span1);
    let input_food_amount = document.createElement("input");
    input_food_amount.setAttribute("id","load-my-food-amount");
    input_food_amount.setAttribute("type","number");
    input_food_amount.setAttribute("name","input-my-food-amount");
    input_food_amount.setAttribute("min","0");
    input_food_amount.setAttribute("step","0.1");
    load_food_amount.appendChild(span1);
    input_food_amount.addEventListener("input",function(){ //if no choose food then can't fill in amount
        if(!select_food["food_name"]){
            this.value="";
            show_tip('Please select food first','.load-title_amount');            
        }else if(Number(this.value)){ //if number then calculate pfc
            const tip = document.querySelector('.tip');
            if(tip){ //take off tip if existed
                document.documentElement.style.setProperty('--color',"none");
                tip.remove();
            };
            let portion = (Number(this.value))/100;
            let protein = portion * select_food["protein"];
            let fat = portion * select_food["fat"];
            let carbs = portion * select_food["carbs"];
            let calo = Math.round((protein * 4) + (fat * 9) + (carbs * 4))
            document.querySelector(".load-food-protein-amt").innerHTML = protein.toFixed(1);
            document.querySelector(".load-food-fat-amt").innerHTML = fat.toFixed(1);
            document.querySelector(".load-food-carbs-amt").innerHTML = carbs.toFixed(1);
            document.querySelector(".load-food-calo-amt").innerHTML = String(calo);
        }else if(!this.value){ //if no amount,pfc and calo set to 0
            const tip = document.querySelector('.tip');
            if(tip){ 
                document.documentElement.style.setProperty('--color',"none");
                tip.remove();
            };
            document.querySelector(".load-food-protein-amt").innerHTML="0";
            document.querySelector(".load-food-fat-amt").innerHTML="0";
            document.querySelector(".load-food-carbs-amt").innerHTML="0";
            document.querySelector(".load-food-calo-amt").innerHTML="0";
        };
    });
    load_food_amount.appendChild(input_food_amount);
    load_food_amount.appendChild(span1_1);
    //protein amount
    let load_food_protein = document.createElement("div");
    load_food_protein.classList.add("load-food-protein");
    load_food_protein.classList.add("fill");
    let span2 = document.createElement("span");
    span2.classList.add("load-title");
    span2.innerHTML = "Protein :";
    let span2_1 = document.createElement("span");
    span2_1.classList.add("load-food-protein-amt");
    span2_1.classList.add("amt");
    span2_1.innerHTML="0";
    let span2_2 = document.createElement("span");
    span2_2.innerHTML="g";
    load_food_protein.appendChild(span2);
    load_food_protein.appendChild(span2_1);
    load_food_protein.appendChild(span2_2);    
    //fat amount
    let load_food_fat = document.createElement("div");
    load_food_fat.classList.add("load-food-fat");
    load_food_fat.classList.add("fill");
    let span3 = document.createElement("span");
    span3.classList.add("load-title");
    span3.innerHTML = "Fat :";
    let span3_1 = document.createElement("span");
    span3_1.classList.add("load-food-fat-amt");
    span3_1.classList.add("amt");
    span3_1.innerHTML="0";
    let span3_2 = document.createElement("span");
    span3_2.innerHTML="g";
    load_food_fat.appendChild(span3);
    load_food_fat.appendChild(span3_1);
    load_food_fat.appendChild(span3_2); 
    //carb amount
    let load_food_carbs = document.createElement("div");
    load_food_carbs.classList.add("load-food-carbs");
    load_food_carbs.classList.add("fill");
    let span4 = document.createElement("span");
    span4.classList.add("load-title");
    span4.innerHTML = "Carbs :";
    let span4_1 = document.createElement("span");
    span4_1.classList.add("load-food-carbs-amt");
    span4_1.classList.add("amt");
    span4_1.innerHTML="0";
    let span4_2 = document.createElement("span");
    span4_2.innerHTML="g";
    load_food_carbs.appendChild(span4);
    load_food_carbs.appendChild(span4_1);
    load_food_carbs.appendChild(span4_2); 
    //consuming calories
    let load_food_calo = document.createElement("div");
    load_food_calo.classList.add("load-food-calo");
    load_food_calo.classList.add("fill");
    let span5 = document.createElement("span");
    span5.classList.add("load-title");
    span5.innerHTML = "Calories :";
    let span5_1 = document.createElement("span");
    span5_1.classList.add("load-food-calo-amt");
    span5_1.classList.add("amt");
    span5_1.innerHTML="0";
    let span5_2 = document.createElement("span");
    span5_2.innerHTML="kcal";
    load_food_calo.appendChild(span5);
    load_food_calo.appendChild(span5_1);
    load_food_calo.appendChild(span5_2);   
    //button
    let btn_div = document.createElement("div");
    btn_div.classList.add("load-food-btn");
    let submit_btn = document.createElement("span");
    submit_btn.classList.add("submit-load-food");
    submit_btn.innerHTML = "Add";
    submit_btn.addEventListener("click",function(){ 
        let amount = document.getElementById("load-my-food-amount");
        if(select_food["food_name"]===null){ 
            show_tip('Please select food first','.load-title_amount');
        }else if(!amount.value){ 
            show_tip('Enter consuming amount','.load-title_amount');
        }else if(!Number(amount.value)){ 
            show_tip('Enter valid amount','.load-title_amount');
        }else if(Number(amount.value)<=0){ //if amount <=0
            show_tip('Amount needs to be > 0','.load-title_amount');
        }else{ 
            let consume_calo = Number(document.querySelector(".load-food-calo-amt").textContent);
            let consume_protein = Number(document.querySelector(".load-food-protein-amt").textContent);
            let consume_fat = Number(document.querySelector(".load-food-fat-amt").textContent);
            let consume_carbs = Number(document.querySelector(".load-food-carbs-amt").textContent);
            select_food["calories"] = consume_calo;
            let payload = {
                "create_at" : on_date_utc,
                "record_id" : record_id,
                "food_name" : select_food["food_name"],
                "protein" : consume_protein,
                "fat" : consume_fat,
                "carbs" : consume_carbs,
                "amount" : Number(Number(amount.value).toFixed(1))
            };
            let selected = document.querySelector(".selected");
            selected.classList.toggle("selected");            
            let promise = add_intake(JSON.stringify(payload),"load");
            promise.then((result)=>{
                let amount = document.getElementById("load-my-food-amount");
                amount.value="";
                let l = [".load-food-protein-amt",".load-food-fat-amt",".load-food-carbs-amt",".load-food-calo-amt"];
                for(let i = 0;i<l.length;i++){
                    let span = document.querySelector(l[i]);
                    span.innerHTML="0";
                };
            }).catch((msg)=>{
                console.log(msg);
            });
        };
    });
    let close_btn = document.createElement("span");
    close_btn.classList.add("close-load");
    close_btn.innerHTML = "Close";
    close_btn.addEventListener("click",function(){
        document.body.classList.toggle("stop-scrolling");
        let bg = document.getElementsByClassName('bg');
        document.body.removeChild(bg[0]);
        my_food_page_load = 0; 
        can_get_my_food = true;
        //select_food set back to null
        select_food={"food_name":null,
                 "food_id":null, 
                 "protein":null,
                 "carbs":null,
                 "fat":null, 
                 "calories":null}
    });
    btn_div.appendChild(close_btn);
    btn_div.appendChild(submit_btn);    
    load_food_form.appendChild(title_div);
    load_food_form.appendChild(load_food_amount);
    load_food_form.appendChild(load_food_protein);
    load_food_form.appendChild(load_food_fat);
    load_food_form.appendChild(load_food_carbs);
    load_food_form.appendChild(load_food_calo);
    load_food_form.appendChild(btn_div);
    load_amount_div.appendChild(load_food_form);
    my_food_box.appendChild(load_amount_div);
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
    span.addEventListener("click",function(){ //click to show my food
        let bg = render_my_food_window(createBack());
        document.body.appendChild(bg);
    });
    personal_food.appendChild(span);
    navmenu.appendChild(personal_food);
};


/* my diet plan */


async function delete_plan(plan_id_token){
    let jwt = localStorage.getItem("JWT");
    try{
        let plan_id = plan_id_token.split('-')[1];
        let response = await fetch('/api/plans?plan_id='+plan_id,{
                                                    method: 'delete',
                                                    headers: {"Authorization" : `Bearer ${jwt}`}
                                                });                               
        if(response.status===204){  
            //re get_diet_plan
            let tbody = document.querySelector(".plan-body");
            while(tbody.firstChild){
                tbody.firstChild.remove(); 
            };    
            my_plan_page = 0;
            get_diet_plan(my_plan_page,"foredit");
        }else if(response.status === 400){ 
            console.log("刪除失敗");
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



async function add_diet_plan(payload,jwt){
    try{
        let response = await fetch('/api/plans',{
                                     method: 'post',
                                     body : payload,
                                     headers: {"Authorization" : `Bearer ${jwt}`,'Content-Type': 'application/json'}
                                    });
        let result = await response.json();                            
        if(response.status === 201){ 
            //call get_diet_plan,set my_plan_page = 0,clear out tbody
            let tbody = document.querySelector(".plan-body");
            while(tbody.firstChild){
                tbody.firstChild.remove(); 
            };    
            my_plan_page = 0;
            get_diet_plan(my_plan_page,"foredit");    
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
        };
    }catch(message){
        console.log(`${message}`)
        throw Error('Fetching was not ok!!.')
    };  
}; 


//verify add new diet plan data 
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
    };
    return result;     
};



//organize adding new diet plan data 
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
};




//create tr for editing diet plan
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
    td_delete.setAttribute("id",'del-'+plan["plan_id"]); //put plan_id in garbage can
    let delete_icon = document.createElement("i");
    delete_icon.setAttribute("data-feather","trash");
    td_delete.addEventListener("click",function(){ 
        can_get_my_plan = false; 
        delete_plan(this.id);
    });
    td_delete.appendChild(delete_icon);
    tr.appendChild(th);
    tr.appendChild(td_p);
    tr.appendChild(td_f);
    tr.appendChild(td_c);
    tr.appendChild(td_calories);
    tr.appendChild(td_delete);
    return tr;
}




function render_my_plan_window(background){
    let load_plan_box = document.createElement("div");
    load_plan_box.classList.add("load-plan-box");
    let load_plan = document.createElement("div");
    load_plan.classList.add("load-plan");
    let title_div = document.createElement("div");
    title_div.classList.add("edit-title");
    let span1 = document.createElement("span");
    span1.classList.add("load-plan-title");
    span1.innerHTML="Edit your diet plan.";
    title_div.appendChild(span1);
    let break_line = document.createElement("div");
    break_line.classList.add("break");
    let diet_plan = document.createElement("div");
    diet_plan.classList.add("diet-plan");//
    diet_plan.addEventListener("scroll",function(){ 
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
    get_diet_plan(my_plan_page,"foredit"); //get diet plan 
    table.appendChild(tbody);
    diet_plan.appendChild(table);
    load_plan.appendChild(title_div);
    load_plan.appendChild(break_line);
    load_plan.appendChild(diet_plan);
    let add_plan = document.createElement("div");
    add_plan.classList.add("add-plan");
    //add your new plan
    let add_plan_title = document.createElement("div");
    add_plan_title.classList.add("add-plan_title");
    let span = document.createElement("span");
    span.classList.add("add-plan_span");
    span.innerHTML = "Add your new plan here.";
    add_plan_title.appendChild(span);
    //new protein
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
    //new fat
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
    //new carb
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
    //new calories
    let add_plan_calories = document.createElement("div");
    add_plan_calories.classList.add("add-plan_calories");
    let div_calories = document.createElement("div");
    div_calories.innerHTML = "Calories(kcal)";
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
    span_cancel.addEventListener("click",function(){ 
        document.body.classList.toggle("stop-scrolling");
        let bg = document.getElementsByClassName('bg');
        document.body.removeChild(bg[0]);
        //set global variables to null
        my_plan_page = 0;
        can_get_my_plan = true;
    });
    let span_select = document.createElement("span");
    span_select.classList.add("submit-select");
    span_select.addEventListener("click",function(){ //click on adding new diet plan
        let validate = validate_new_plan();
        if(validate){
            can_get_my_plan = false; 
            let jwt = localStorage.getItem("JWT");
            let json_data = organize_new_plan();
            add_diet_plan(json_data,jwt);
        };     
    });
    span_select.innerHTML="Save change";
    select_btn.appendChild(span_cancel);
    select_btn.appendChild(span_select);
    load_plan.appendChild(select_btn);
    load_plan_box.appendChild(load_plan);
    background.appendChild(load_plan_box);
    return background;
};



/* My Plan */

function render_my_plan(navmenu){
    let personal_plan = document.createElement("div");
    personal_plan.classList.add("nav-page");
    personal_plan.classList.add("personal-plan");
    let span = document.createElement("span");
    span.setAttribute("id","dietplan");
    span.appendChild(document.createTextNode("My Diet Plan"));
    span.addEventListener("click",function(){ 
        let bg = render_my_plan_window(createBack());
        document.body.appendChild(bg);
        let remind = document.querySelector(".remind");
        if(remind){
            remind.remove();
        };
    });
    personal_plan.appendChild(span);
    navmenu.appendChild(personal_plan);
};


/* my weight */

function validate_weight(name_attr,class_attr){
    let weight_input = document.getElementsByName(name_attr)[0];
    let result = true;
    if(!weight_input.value || !Number(weight_input.value)){
        show_tip('Enter a valid weight', "."+class_attr);
        result = false;
        return result;
    }else if(Number(weight_input.value)<20 || Number(weight_input.value)>200){
        show_tip('Weight should be between 20 and 200',"." + class_attr);
        result = false;
        return result;
    };
    return result;
};


function organize_weight_data(name_attr){
    let weight_input = document.getElementsByName(name_attr)[0];
    let weight = Number((Number(weight_input.value).toFixed(1)));
    let today = new Date();
    let today_utc = date_to_stamp(today); //today
    let data;
    if(name_attr==="addweight"){
        data = {
            "create_at" : today_utc,
            "weight" : weight
        };
    }else{
        data = {
            "create_at" : today_utc,
            "new_weight" : weight
        };
    }    
    return JSON.stringify(data)
};


function date_to_stamp(d){
    let year = d.getFullYear(); 
    let month = d.getMonth();
    let date = d.getDate();   
    let new_date = new Date(year,month,date);
    let now_utc =  new_date.getTime();
    return now_utc;
};


async function get_weight(sdate,edate){
    let jwt = localStorage.getItem("JWT");
    try{
        let response = await fetch(`/api/weight?sdate=${sdate}&edate=${edate}`,{
                                                method: 'get',
                                                headers: {"Authorization" : `Bearer ${jwt}`}
                                                });
        let result = await response.json();                                
        if(response.ok){  
            //remove old one
            let canvas = Chart.getChart("weight");
            if(canvas){
                canvas.destroy(); 
            };
            let final_data = [];
            let how_many_days = ((edate - sdate)/86400000)+1;
            let select_date = [sdate];
            for(let i=0;i<how_many_days-1;i++){
                sdate += 86400000;
                select_date.push(sdate);
            };
            //re-draw
            if(result["weight_record"]){ 
                let weight = result["weight_record"];
                let weight_data = {}
                let temp_weight = [] //for calculate max and min weight
                for(let i=0;i < weight.length;i++){
                    weight_data[weight[i]["create_at"]] = weight[i]["weight"];
                    temp_weight.push(weight[i]["weight"]);
                };
                for(let i=0;i<select_date.length;i++){
                    if(weight_data[select_date[i]]){
                        final_data.push({
                            x : select_date[i],
                            y : weight_data[select_date[i]],
                        });      
                    }else{
                        final_data.push({
                            x : select_date[i],
                            y : null
                        })
                    };
                };
                //adjust based on max and min weight
                weight_config.options.scales.y.suggestedMin = Math.min.apply(null, temp_weight)-5;
                weight_config.options.scales.y.suggestedMax = Math.max.apply(null, temp_weight)+5;
                dataLI.datasets[0].data = final_data;
            }else{ //no weight record
                for(let i=0;i<select_date.length;i++){
                    final_data.push({
                        x : select_date[i],
                        y : null
                    });
                };
                dataLI.datasets[0].data = final_data;
            };
            // re-render
            let line_chart = new Chart(
                document.getElementById("weight").getContext("2d"),
                weight_config
            );
            weight_action = true;
        }else if(response.status === 400){
            console.log(result);
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


async function add_today_weight(payload,jwt){
    try{
        let response = await fetch('/api/weight',{
                                     method: 'post',
                                     body : payload,
                                     headers: {"Authorization" : `Bearer ${jwt}`,'Content-Type': 'application/json'}
                                    });
        let result = await response.json();                            
        if(response.status === 201){ 
            let end_date = new Date();
            let end_utc = date_to_stamp(end_date); // today is end date
            let start_utc = end_utc - (6*86400000);
            get_weight(start_utc,end_utc);
            let weight_input = document.getElementsByName("addweight")[0];
            weight_input.value = "";
            let tip = document.querySelector(".tip");
            if(tip){
                tip.remove();
            };
        }else if (response.status === 403){
            console.log('JWT已失效,請重新登入');
            localStorage.removeItem("JWT");
            window.location.href = '/';
        }else if (response.status === 400){
            console.log(result);
            let weight_input = document.getElementsByName("addweight")[0];
            weight_input.value = "";
            show_tip('Already have record.',"." + "add-weight-title");
            weight_action = true;
        }else{
            console.log('伺服器錯誤');
        };
    }catch(message){
        console.log(`${message}`)
        throw Error('Fetching was not ok!!.')
    };  
};   


async function update_today_weight(payload,jwt){
    try{
        let response = await fetch('/api/weight',{
                                     method: 'PATCH',
                                     body : payload,
                                     headers: {"Authorization" : `Bearer ${jwt}`,'Content-Type': 'application/json'}
                                    });                       
        let result = await response.json();                            
        if(response.ok){ 
             let end_date = new Date();
             let end_utc = date_to_stamp(end_date);e
             let start_utc = end_utc - (6*86400000);
             get_weight(start_utc,end_utc);
             let weight_input = document.getElementsByName("updateweight")[0];
             weight_input.value = "";
             let tip = document.querySelector(".tip");
             if(tip){
                 tip.remove();
             };
        }else if (response.status === 403){
            console.log(result);
            console.log('JWT已失效,請重新登入');
            localStorage.removeItem("JWT");
            window.location.href = '/';
        }else if (response.status === 400){
            console.log(result);
            let weight_input = document.getElementsByName("updateweight")[0];
             weight_input.value = "";
            show_tip('No record for today to update.',"." + "update-weight-title");
            weight_action = true;
        }else{
            console.log('伺服器錯誤');
        }
    }catch(message){
        console.log(`${message}`)
        throw Error('Fetching was not ok!!.')
    };   
};




function show_weight_section(){
    let datepicker_toggle = document.querySelector(".datepicker-toggle");
    let show_date = document.querySelector(".show-date");
    let daily_title = document.querySelector(".daily-title");
    datepicker_toggle.remove();
    show_date.remove();
    daily_title.remove();
    let select_date_range = document.createElement("div");
    select_date_range.classList.add("select-date-range");
    let label = document.createElement("label");
    label.innerHTML = "Select a date range to show your weight.";
    let daterange_input = document.createElement("input");
    daterange_input.setAttribute("type","text");
    daterange_input.setAttribute("name","daterange");
    select_date_range.appendChild(label);
    select_date_range.appendChild(daterange_input);
    //weight record title
    let title_div = document.createElement("div");
    title_div.classList.add("weight-title")
    title_div.innerHTML = "Weight Record";
    let calender_container = document.querySelector(".calender-container");
    calender_container.appendChild(select_date_range);
    calender_container.appendChild(title_div);
    let left_record = document.querySelector(".left-record");
    let right_record = document.querySelector(".right-record");
    //take off start record(if not from record page)
    let start_record = document.querySelector(".start-record")
    if(left_record && right_record){
        left_record.remove();
        right_record.remove();
    }else if(start_record){
        start_record.remove();
    };
    //change "record-container" to "grid-template-column=1fr"
    let record_container = document.querySelector(".record-container");
    record_container.style.gridTemplateColumns="1fr";
    //put in weight input box
    let weight_record = document.createElement("div");
    weight_record.classList.add("weight-record-container");
    //weight input box
    let weight_input_container = document.createElement("div");
    weight_input_container.classList.add("weight-input-container");
    //add today weight
    let add_weight = document.createElement("div");
    add_weight.classList.add("add-weight");
    let add_weight_title = document.createElement("span");
    add_weight_title.classList.add("add-weight-title");
    add_weight_title.innerHTML = "Record today's weight (kg) :";
    let add_weight_bar = document.createElement("input");
    add_weight_bar.classList.add("add-weight-bar");
    add_weight_bar.setAttribute("name","addweight");
    add_weight_bar.setAttribute('type',"number");
    add_weight_bar.setAttribute("step","0.1");
    add_weight_bar.setAttribute("min","0");
    let add_weight_btn = document.createElement("div");
    add_weight_btn.classList.add("add-weight-btn");
    let span_cancel = document.createElement("span");
    span_cancel.classList.add("cancel-add-weight");
    span_cancel.innerHTML="Cancel";
    span_cancel.addEventListener("click",function(){ 
        let weight_input = document.getElementsByName("addweight")[0];
        weight_input.value = "";
    });
    let span_submit = document.createElement("span");
    span_submit.classList.add("submit-add-weight");
    span_submit.innerHTML="Save";
    span_submit.addEventListener("click",function(){ 
        //verify if input
        if(weight_action){
            weight_action = false;
            let result = validate_weight("addweight","add-weight-title");
            if(result){
                let data = organize_weight_data("addweight");
                let jwt = localStorage.getItem("JWT");
                add_today_weight(data,jwt);
            }else{
                weight_action = true;
            };
        };    
    });
    add_weight_btn.appendChild(span_cancel);
    add_weight_btn.appendChild(span_submit);
    add_weight.appendChild(add_weight_title);
    add_weight.appendChild(add_weight_bar);
    add_weight.appendChild(add_weight_btn);
    weight_input_container.appendChild(add_weight);
    let update_weight = document.createElement("div");
    update_weight.classList.add("update-weight");
    let update_weight_title = document.createElement("span");
    update_weight_title.classList.add("update-weight-title");
    update_weight_title.innerHTML = "Update today's weight (kg) :";
    let update_weight_bar = document.createElement("input");
    update_weight_bar.classList.add("update-weight-bar");
    update_weight_bar.setAttribute("name","updateweight");
    update_weight_bar.setAttribute('type',"number");
    update_weight_bar.setAttribute("step","0.1");
    update_weight_bar.setAttribute("min","0");
    let update_weight_btn = document.createElement("div");
    update_weight_btn.classList.add("update-weight-btn");
    let update_span_cancel = document.createElement("span");
    update_span_cancel.classList.add("cancel-update-weight");
    update_span_cancel.innerHTML="Cancel";
    update_span_cancel.addEventListener("click",function(){ 
        let weight_input = document.getElementsByName("updateweight")[0];
        weight_input.value = "";
    });
    let update_span_submit = document.createElement("span");
    update_span_submit.classList.add("submit-update-weight");
    update_span_submit.innerHTML="Update";
    update_span_submit.addEventListener("click",function(){ 
        let result = validate_weight("updateweight","update-weight-title");
        if(result){
            let data = organize_weight_data("updateweight");
            let jwt = localStorage.getItem("JWT");
            update_today_weight(data,jwt);
        }else{
            weight_action = true;
        };
    });
    update_weight_btn.appendChild(update_span_cancel);
    update_weight_btn.appendChild(update_span_submit);
    update_weight.appendChild(update_weight_title);
    update_weight.appendChild(update_weight_bar);
    update_weight.appendChild(update_weight_btn); 
    weight_input_container.appendChild(update_weight);
    weight_record.appendChild(weight_input_container);
    //line chart section
    let line_chart = document.createElement("div");
    line_chart.classList.add("line-chart");
    let canvas = document.createElement("canvas");
    canvas.setAttribute("id","weight");
    line_chart.appendChild(canvas);
    //put in weight_record
    weight_record.appendChild(line_chart);
    //then put in record_container
    record_container.appendChild(weight_record);
    $('input[name="daterange"]').daterangepicker({
        opens: 'right'
    }, function(start, end, label) {
        if(start.format('YYYY-MM-DD') === end.format('YYYY-MM-DD')){
            console.log('不能一樣');
        }else{
            let sutc = date_to_stamp(start._d);
            let eutc = date_to_stamp(end._d);
            get_weight(sutc,eutc);
        };
    });
    //show 7 days record
    let end_date = new Date();
    let end_utc = date_to_stamp(end_date); 
    let start_utc = end_utc - (6*86400000);
    get_weight(start_utc,end_utc);
};


/* weight record */

function render_my_weight(navmenu){
    let weight_record = document.createElement("div");
    weight_record.classList.add("nav-page");
    weight_record.classList.add("weight-record");
    let span = document.createElement("span");
    span.setAttribute("id","weightrecord");
    span.appendChild(document.createTextNode("Weight Record"));
    span.addEventListener("click",function(){ 
        if(!already_on_weight_page){
            already_on_weight_page = true;
            already_on_record_page = false;
            show_weight_section();
        };
    });
    weight_record.appendChild(span);
    navmenu.appendChild(weight_record);
}

/* Daily Record */
function render_my_record(navmenu){
    let diet_record = document.createElement("div");
    diet_record.classList.add("nav-page");
    diet_record.classList.add("daily-record");
    let span = document.createElement("span");
    span.setAttribute("id","dailyrecord");
    span.appendChild(document.createTextNode("Daily Record"));
    span.addEventListener("click",function(){ 
        if(!already_on_record_page){
            already_on_weight_page = false;
            already_on_record_page = true;
            let calender_container = document.querySelector(".calender-container");
            let record_container = document.querySelector(".record-container");
            calender_container.remove();
            record_container.remove();
            get_record(on_date_utc,on_date_format);
            already_on_record_page = true;
        };
    });
    diet_record.appendChild(span);
    navmenu.appendChild(diet_record);
};


/* health helper */
function render_health_helper(navmenu){
    let health_helper = document.createElement("div");
    health_helper.classList.add("nav-page");
    health_helper.classList.add("health-helper");
    let span = document.createElement("span");
    span.setAttribute("id","healthhelper");
    span.appendChild(document.createTextNode("Health Helper"));
    span.addEventListener("click",function(){ //to chat page
        window.open('https://www.macroseat.xyz/helper', '_blank'); 
    });
    health_helper.appendChild(span);
    navmenu.appendChild(health_helper);
};


/* log out */
async function log_out(){
    try{
        let response = await fetch('/api/users/signout',{method: 'DELETE'});
        let result = await response.json();    
        console.log(result);                            
        if(response.ok){ 
               localStorage.removeItem('JWT');
               window.location.reload();
        };
    }catch(message){
        console.log(`${message}`)
        throw Error('Fetching was not ok!!.')
    };     
};


function render_log_out(navmenu){
    let logout_div = document.createElement("div");
    logout_div.classList.add("logout");
    logout_div.appendChild(document.createTextNode("Logout"));
    logout_div.addEventListener("click",function(){ 
        log_out();
        //emit one event to server
        if(user_socket){
            user_socket.emit("user_log_out"); 
        }else if(nutri_socket){
            nutri_socket.emit("nutri_log_out")
        };
    });
    navmenu.appendChild(logout_div);
};





//side bar
function render_sidebar(user_data){
    let navmenu = document.querySelector(".navmenu");
    render_user_profile(navmenu,user_data);
    render_my_food(navmenu);
    render_my_plan(navmenu);
    render_my_weight(navmenu);
    render_my_record(navmenu);
    render_health_helper(navmenu);
    render_log_out(navmenu);
    let remind = document.getElementById("remind").textContent;
    if(remind === "yes"){ 
        let my_plan = document.querySelector(".personal-plan");
        let remind_div = document.createElement('div');
        remind_div.classList.add("remind");
        let span = document.createElement("span");
        span.appendChild(document.createTextNode("Check this out ! Your first recommended diet plan has been created by system based on your information."));
        let close = document.createElement("div");
        close.classList.add("close-remind");
        close.innerHTML = "X";
        close.addEventListener("click",function(){
            let div = document.querySelector(".remind");
            div.remove();
        });
        remind_div.appendChild(span);
        remind_div.appendChild(close);
        my_plan.appendChild(remind_div);
        window.setTimeout(function(){
            let div = document.querySelector(".remind");
            if(div){
                div.remove();
            };
        }, 60000);
    };
};
