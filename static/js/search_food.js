let search_times = 0;
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



async function get_food(food,jwt){
    try{
        let response  = await fetch("/api/public-food?keyword="+food,
                                    {headers: {"Authorization" : `Bearer ${jwt}`}
                                    });
        let data = await response.json();
        return data
    }catch(message){
        console.log(`${message}`);
        throw Error('Fetching was not ok!!.');
    }    
};


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
        let li = document.createElement("li");
        li.appendChild(document.createTextNode(data[i]["food_name"]));
        li.setAttribute("food_id",data[i]["food_id"])
        li.setAttribute("protein",data[i]["protein"])
        li.setAttribute("fat",data[i]["fat"])
        li.setAttribute("carbs",data[i]["carbs"])
        li.classList.add("food-item");
        //li.addEventListener("mouseenter",function(){ //mouseon的時候顯示PFC和熱量
        //    show_food_info(); 
        //});
        li.addEventListener("click",function(){ //按下去的時候鎖定食物,存在全域變數,
            lock_food(this); 
     });
        ul.appendChild(li);    
    }
    div.appendChild(ul);
    input_area.appendChild(div);
}














