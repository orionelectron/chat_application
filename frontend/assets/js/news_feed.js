let notification_container = document.getElementById("notification_container");
let message_container = document.getElementById("message_container");
let message_content_container = document.getElementById("message_content_container");
let notification_content_container = document.getElementById("notification_content_container");
let top_places_container = document.getElementById("top_places_container");
let friend_request_container = document.getElementById("friend_request_container");


let friend_request_list = [{
    id: 1,
    from_user: 3,
    to_user: 4,
    username: "Pawan Kandel",
    photo_path: "https://picsum.photos/600/400",
    accepted: false,
    timestamp: 3333333333
},
{
    id: 1,
    from_user: 3,
    to_user: 4,
    username: "Orion Electron",
    photo_path: "https://picsum.photos/600/400",
    accepted: false,
    timestamp: 3333333333
},
{
    id: 1,
    from_user: 3,
    to_user: 4,
    username: "drona kanta kandel",
    photo_path: "https://picsum.photos/600/400",
    accepted: false,
    timestamp: 3333333333
}];
let notifications_list = [{
    id: 1,
    from_user: 1,
    to_user: 3,
    status: "unread",
    username: "Orion Electron",
    notification_message: "Liked your post",
    timestamp: 3234244461
}];

let top_places_list = [
    {
        id: 1,
        name: "Bharatpur",
        description: "This is a good tourist destination for those who want to live their best life",
        photo_path: "https://picsum.photos/600/400",
        location: "chitwan",
        rating: 5

    },
    {
        id: 1,
        name: "Bharatpur",
        description: "This is a good tourist destination for those who want to live their best life",
        photo_path: "https://picsum.photos/600/400",
        location: "chitwan",
        rating: 5

    },
    {
        id: 1,
        name: "Bharatpur",
        description: "This is a good tourist destination for those who want to live their best life",
        photo_path: "https://picsum.photos/600/400",
        location: "chitwan",
        rating: 5

    }
];


let messages_list = [];
function timeAgo(timestamp) {
    const now = new Date();
    const posted = new Date(timestamp * 1000);
    const elapsed = (now - posted) / 1000; // Time elapsed in seconds

    if (elapsed < 60) {
        return 'just now';
    } else if (elapsed < 3600) {
        const minutes = Math.floor(elapsed / 60);
        return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
    } else if (elapsed < 86400) {
        const hours = Math.floor(elapsed / 3600);
        return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    } else if (elapsed < 604800) {
        const days = Math.floor(elapsed / 86400);
        return `${days} day${days !== 1 ? 's' : ''} ago`;
    } else {
        return posted.toLocaleString(); // If more than a week ago, return the date/time
    }
}

function open_messenger(){
    
}

function render_top_places_list() {
    let final_html = '<h2 class="text-xl font-bold mb-4">Top Places</h2>';
    let template = `
 <div class="bg-white rounded-lg shadow-lg overflow-hidden">
 <img src="{photo_path}" alt="Place 1" class="w-full h-48 object-cover">
 <div class="p-4">
     <h3 class="text-lg font-bold mb-2">{name}</h3>
     <p class="text-gray-700">{description}</p>
     <div class="mt-4 flex justify-between">
         <div>
             <i class="fas fa-map-marker-alt text-gray-400"></i>
             <span class="ml-2 text-gray-600">Location: {location}</span>
         </div>
         <div>
             <i class="fas fa-star text-yellow-400"></i>
             <i class="fas fa-star text-yellow-400"></i>
             <i class="fas fa-star text-yellow-400"></i>
             <i class="fas fa-star-half-alt text-yellow-400"></i>
             <i class="far fa-star text-yellow-400"></i>
         </div>
     </div>
 </div>
</div>
 `;
    for (let i = 0; i < top_places_list.length; i++) {
        let top_place = top_places_list[i];

        let final_template = template.replace(/{([^{}]+)}/g, function (keyExpr, key) {
            return top_place[key] || "";
        });
        //console.log("template", friend_template);
        final_html = final_html + final_template;
    }
    top_places_container.innerHTML = final_html;
}

function render_notifications_list() {
    let final_html = "";
    template = `
    <a href="#"
    class="bg-gradient-to-r from-violet-100 via-pink-100 flex items-center  px-4 py-3 hover:bg-gray-200">
    <div class="basis-1/6 mx-1">
        <i class="fas fa-user-circle fa-2x"></i>
    </div>
    <div class="basis-4/6 text-sm font-medium mx-2">
        <p class="text-black">{username}</p>
        <p class="text-gray-500">{notification_message}</p>
    </div>
    <div class="basis-1/6 text-sm text-gray-500">
        <p>{time_ago}</p>
    </div>
</a>
    `;
    for (let i = 0; i < notifications_list.length; i++) {
        let notification = notifications_list[i];

        let final_template = template.replace(/{([^{}]+)}/g, function (keyExpr, key) {


            if (key === "time_ago") {
                return timeAgo(notification.timestamp);
            }
            else {
                return notification[key] || "";
            }


        });
        //console.log("template", friend_template);
        final_html = final_html + final_template;
    }
    notification_content_container.innerHTML = final_html;
}
function render_messages_list() {
    let final_html = "";
    template = `
    <a href="#" class="bg-gradient-to-r from-violet-300 via-pink-300 flex items-center   py-3 hover:bg-gray-200">
                                <div onclick="select_friend({id})"
                                    class="message-item w-full h-full flex hover:bg-gray-300 items-center hover:cursor-pointer  rounded-md  items-center flex-row">
                                    <div class="user-photo-round-small relative w-16 h-16 mr-4">
                                        <img class="rounded-full border w-16 h-16 border-gray-100 shadow-sm"
                                            src="https://source.unsplash.com/random" />
                                        <div
                                            class="friendlist_online_indicator absolute top-0 right-0 h-4 w-4 my-1 border-2 border-white rounded-full bg-green-700 z-2">
                                        </div>
                                    </div>
                                    <div class="user-name-last-message flex flex-col">
                                        <p class="username font-bold text-lg">
                                            {username}
                                        </p>
                                        <p class="last-message text-sky-600 font-medium">
                                            {last_message} <span class="text-gray-900"> {time_ago} </span>
                                        </p>
                                    </div>
                                    <div class="w-4 h-4 unseen_round_indicator rounded-full ml-auto bg-blue-600"> </div>
                                </div>

                            </a>
    `;
    for (let i = 0; i < messages_list.length; i++) {
        let message = messages_list[i];

        let final_template = template.replace(/{([^{}]+)}/g, function (keyExpr, key) {


            if (key === "time_ago") {
                return timeAgo(message.timestamp);
            }
            else {
                return message[key] || "";
            }


        });
        //console.log("template", friend_template);
        final_html = final_html + final_template;
    }
    message_content_container.innerHTML = final_html;
}

function render_friend_request_list() {
    let final_html = "";
    let template = `
        <li class="p-4">
                        <div class="flex items-center space-x-4">
                            <div class="flex-shrink-0">
                                <img class="h-10 w-10 rounded-full" src="{photo_path}"
                                    alt="Profile picture">
                            </div>
                            <div class="flex-grow">
                                <p class="font-medium text-gray-800">{username}</p>
                            </div>
                            <div class="flex gap-2">
                                <button
                                    class="bg-blue-500 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg">Accept</button>
                                <button
                                    class="bg-red-500 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg">Reject</button>
                            </div>
                        </div>
                    </li>
    `;
    for (let i = 0; i < friend_request_list.length; i++) {
        let friend_request = friend_request_list[i];

        let final_template = template.replace(/{([^{}]+)}/g, function (keyExpr, key) {


            if (key === "time_ago") {
                return timeAgo(friend_request.timestamp);
            }
            else {
                return friend_request[key] || "";
            }


        });
        //console.log("template", friend_template);
        final_html = final_html + final_template;
    }
    friend_request_container.innerHTML = final_html;
}

function toggle_notification_container() {
    if (notification_container.classList.contains("hidden")) {
        display_notification_container();
        render_notifications_list();
    }
    else {
        close_notification_container();
    }
}
function display_notification_container() {
    notification_container.classList.remove("hidden")
}

function close_notification_container() {
    notification_container.classList.add("hidden")
}

function toggle_message_container() {
    if (message_container.classList.contains("hidden")) {
        display_message_container();
        render_messages_list();
    }
    else {
        close_message_container();
    }
}
function display_message_container() {
    message_container.classList.remove("hidden")
}

function close_message_container() {
    message_container.classList.add("hidden")
}
render_top_places_list();
render_friend_request_list();