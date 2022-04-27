let search_times = 0;

async function get_food(food){
    try{
        let response  = await fetch("/api/public-food?food="+food);
        let data = await response.json();
        return data
    }catch(message){
        console.log(`${message}`);
        throw Error('Fetching was not ok!!.');
    }    
};



function render_data(data){
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
        li.appendChild(document.createTextNode(data[i]["name"]));
        ul.appendChild(li);    
    }
    div.appendChild(ul);
    input_area.appendChild(div);
}

//4/27搜尋食物的事件註冊,再改成動態render時註冊
document.getElementById("food_name").addEventListener("input",function(){
    let value = this.value;
    //console.log(this);
    if(value === ""){
        let input_area = document.getElementById("input-area");
        if(document.querySelector(".search-result")){
            input_area.removeChild(document.querySelector(".search-result"))
        };
    }else{
        if(n <= 10){
            n += 1;
            //console.log(n);
            let search_promise = get_food(value);
            search_promise.then((result)=>{
                n -= 1;
                //console.log(n);
                render_data(result.data);
            });
        }    
    }    
});













