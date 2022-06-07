let select_food={"food_name":null,
                 "food_id":null, 
                 "protein":null,
                 "carbs":null,
                 "fat":null,
                "calories":null} 

//按下去選的食物後
function lock_food(food){ 
    let input_area = document.getElementById("input-area");
    let input_name = document.getElementById("food_name");
    input_name.value = food.textContent;
    if(document.querySelector(".search-result")){
        input_area.removeChild(document.querySelector(".search-result"))
    };
    select_food["food_name"] = food.textContent;
    select_food["food_id"] = Number(food.getAttribute("food_id"));
    select_food["protein"] = Number(food.getAttribute("protein"));
    select_food["fat"] = Number(food.getAttribute("fat"));
    select_food["carbs"] = Number(food.getAttribute("carbs"));
} 



async function get_food(food,jwt,page){
    try{
        let response  = await fetch(`/api/public-food?keyword=${food}&page=${page}`,
                                    {headers: {"Authorization" : `Bearer ${jwt}`}
                                    });
        let data = await response.json();
        return data
    }catch(message){
        console.log(`${message}`);
        throw Error('Fetching was not ok!!.');
    }    
};


function show_food_info(p,f,c){
    let u =document.querySelector(".u");
    let info_box = document.querySelector(".info-box");
    if(info_box){
        info_box.remove();
    };
    let new_info_box = document.createElement("div");
    new_info_box.classList.add("info-box");
    let ul = document.createElement("ul");
    function create_li(data){
        let li = document.createElement("li");
        let span_1 = document.createElement("span");
        span_1.appendChild(document.createTextNode(data["title"]));
        span_1.classList.add("info")
        let span_2 = document.createElement("span"); 
        span_2.appendChild(document.createTextNode(": "));
        let span_3 = document.createElement("span"); 
        span_3.appendChild(document.createTextNode(data["number"]));
        span_3.classList.add("info-number");
        let span_4 = document.createElement("span"); 
        span_4.appendChild(document.createTextNode("g"));
        li.appendChild(span_1);
        li.appendChild(span_2);
        li.appendChild(span_3);
        li.appendChild(span_4);
        return li;
    }
    datas = [{"title":"P","number":p},
             {"title":"F","number":f},
             {"title":"C","number":c},
            ];
    for(let i=0;i<datas.length;i++){
        let li = create_li(datas[i]);
        ul.appendChild(li);
    } 
    let last_span =  document.createElement("span"); 
    last_span.appendChild(document.createTextNode("(per 100g)"));    
    ul.appendChild(last_span);  
    new_info_box.appendChild(ul);
    u.appendChild(new_info_box);
};



function create_search_li(food){
    let li = document.createElement("li");
    li.appendChild(document.createTextNode(food["food_name"]));
    li.setAttribute("food_id",food["food_id"])
    li.setAttribute("protein",food["protein"])
    li.setAttribute("fat",food["fat"])
    li.setAttribute("carbs",food["carbs"])
    li.classList.add("food-item-li");
    li.addEventListener("mouseenter",function(e){ //mouseenter的時候顯示PFC和熱量
        let p = e.target.getAttribute("protein");
        let f = e.target.getAttribute("fat");
        let c = e.target.getAttribute("carbs");
        show_food_info(p,f,c); 
    });
    li.addEventListener("mouseleave",function(){ //mouseleave的時候移掉食物資訊
        let info_box = document.querySelector(".info-box");
        if(info_box){
            info_box.remove();
        };
    });
    li.addEventListener("click",function(){ //按下去的時候鎖定食物,存在全域變數,
        lock_food(this); 
    });  
    return li;  
}





//not done yet
function render_data(data){
    let input_amount = document.getElementById("food_portion");
    if(input_amount.value){
        input_amount.value = "";
    };
    let input_area = document.getElementById("input-area");
    if(document.querySelector(".search-result")){
        input_area.removeChild(document.querySelector(".search-result"))
    };
    let div = document.createElement("div");
    div.classList.add("search-result");
    let ul = document.createElement("ul");
    ul.classList.add("u");
    for(let i=0;i<data.length;i++){
        let li = create_search_li(data[i]);
        ul.appendChild(li);  
    };
    ul.addEventListener("scroll",function(){ //註冊滑動載入事件
        if(this.scrollHeight-this.scrollTop <= this.clientHeight){
            if(can_get_public_food_scroll && public_food_page){
                can_get_public_food_scroll = false;
                let jwt = localStorage.getItem("JWT");
                let keyword = document.getElementById("food_name").value;
                let promise = get_food(keyword,jwt,public_food_page);
                promise.then((result)=>{
                    can_get_public_food_scroll = true;
                    let next_page = result["nextPage"];
                    public_food_page = next_page;
                    let ul = document.querySelector(".u");
                    for(let i=0;i<result.data.length;i++){
                        let li = create_search_li(result.data[i]);
                        ul.appendChild(li);  
                    };
                });
            }
        };
    });
    div.appendChild(ul);
    input_area.appendChild(div);
}














