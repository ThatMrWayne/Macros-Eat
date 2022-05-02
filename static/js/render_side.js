let my_food_page = 0; 



/*會員頁部分*/

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
    img.classList.add("prodile_picture");
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


/*我的食物部分*/


async function get_my_food(){ //get_my_food成功後才render_my_food
    let jwt = localStorage.getItem("JWT");
    try{
        let response = await fetch('/api/my-food?page='+my_food_page,{
                                                    method: 'get',
                                                    headers: {"Authorization" : `Bearer ${jwt}`}
                                                });
        let result = await response.json();                                
        if(response.ok){  //200情況下 
            console.log(result);
            //插到myfood顯示匡內




               
        }else if(response.status === 400){ //
                
        }else if(response.status === 500){ //如果是500,代表伺服器(資料庫)內部錯誤
                
        };
    }catch(message){
        console.log(`${message}`)
        throw Error('Fetching was not ok!!.')
    }; 

};


function render_my_food(){


}



/* My Food */

function render_my_food(navmenu){
    let personal_food = document.createElement("div");
    personal_food.classList.add("nav-page");
    personal_food.classList.add("personal-food");
    let span = document.createElement("span");
    span.setAttribute("id","myfood");
    span.appendChild(document.createTextNode("My Food"));
    span.addEventListener("click",function(){ //按下後產生我的食物
        render_my_food();
    });
    personal_food.appendChild(span);
    navmenu.appendChild(personal_food);
}








//產生side bar
function render_sidebar(user_data){
    console.log('sidebar');
    if(a){   // 如果有xxx就不用在產生




    }else{ 
        let navmenu = document.querySelector(".navmenu");
        render_user_profile(navmenu,user_data);
        render_my_food(navmenu)



    }
    



}
