let notification_container = document.getElementById("notification_container");
let message_container = document.getElementById("message_container");
let message_content_container = document.getElementById("message_content_container");
let notification_content_container = document.getElementById("notification_content_container");
let top_places_container = document.getElementById("top_places_container");
let friend_request_container = document.getElementById("friend_request_container");
let post_file_chooser = document.getElementById("post_file_chooser");
let attachment_view = document.getElementById("attachment_view");
let post_send_button = document.getElementById("post_send_button");
let post_content_input = document.getElementById("post_content_input");
let live_search_bar = document.getElementById("live_search_bar");
let live_search_container = document.getElementById("live_search_container");
let live_search_content_container = document.getElementById("live_search_content_container");
const user_id = document.getElementById('user_id').value || 123;
const token = document.getElementById('token').value || '1234';



let post_attachment_list = [];
let live_search_list = [];

let friend_request_list = [];
let notifications_list = [
];

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
        name: "Palace",
        description: "This is a good tourist destination for those who want to live their best life",
        photo_path: "https://picsum.photos/600/400",
        location: "Palpa",
        rating: 5

    },
    {
        id: 1,
        name: "National Park",
        description: "This is a good tourist destination for those who want to live their best life",
        photo_path: "https://picsum.photos/600/400",
        location: "chitwan",
        rating: 5

    }
];


let messages_list = [];
function timeAgo(timestamp) {
    const now = new Date();
    const posted = Date.parse(timestamp);
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

function open_messenger() {

}

let live_search_bar_timeout = null;
live_search_bar.addEventListener("input", (event) => {

    clearTimeout(live_search_bar_timeout);
    live_search_bar_timeout = setTimeout(() => {

        let username = event.target.value.toLowerCase();
        search_for_users(username);


    }, 1000)


})

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
        <p class="text-gray-500">{message}</p>
    </div>
    <div class="basis-1/6 text-sm text-gray-500">
        <p>{created_at}</p>
    </div>
</a>
    `;
    for (let i = 0; i < notifications_list.length; i++) {
        let notification = notifications_list[i];

        let final_template = template.replace(/{([^{}]+)}/g, function (keyExpr, key) {


            if (key === "created_at") {
                console.log(notification.created_at)
                return timeAgo(notification.created_at);
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
                                <img class="h-10 w-10 rounded-full" src="{profile_picture_path}"
                                    alt="Profile picture">
                            </div>
                            <div class="flex-grow">
                                <p class="font-medium text-gray-800">{username}</p>
                            </div>
                            <div class="flex gap-2">
                                <button onclick="accept_friend_request({friend_request_id})"
                                    class="bg-blue-500 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg">Accept</button>
                                <button onclick="reject_friend_request({friend_request_id})"
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
            else if (key == "profile_picture_path") {
                return "https://source.unsplash.com/random"
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
function get_friend_request(friend_request_id) {

    for (let i = 0; i < friend_request_list.length; i++) {
        if (friend_request_list[i].friend_request_id == friend_request_id) {

            return friend_request_list[i];
        }
    }


}
function accept_friend_request(friend_request_id) {
    console.log("Accepted friend request", friend_request_id);
    let friend_request = get_friend_request(friend_request_id);
    console.log(friend_request)
    axios.get('https://192.168.1.187:3000/friend_requests/accept', {
        params: {
            from_user: friend_request.to_user_id,
            to_user: friend_request.from_user_id,
            friend_request_id

        }

    })
        .then(function (response) {
            console.log(response.data);

        })
        .catch(function (error) {
            console.log(error);
        });
}
function reject_friend_request(friend_request_id) {
    console.log("Rejected friend request", friend_request_id);
    let friend_request = get_friend_request(friend_request_id);
    console.log(friend_request)
    axios.get('https://192.168.1.187:3000/friend_requests/reject', {
        params: {
            from_user: friend_request.to_user_id,
            to_user: friend_request.from_user_id,
            friend_request_id

        }
    })
        .then(function (response) {
            console.log(response.data);

        })
        .catch(function (error) {
            console.log(error);
        });
}
function render_friend_poll() {
    let template = `
    <div class="p-4 bg-white rounded-lg shadow-md flex flex-col gap-2">
    <div class="flex space-x-4">
        <div class="flex-shrink-0">
            <img class="h-12 w-12 rounded-full object-cover" src="https://picsum.photos/200">
        </div>
        <div class="flex-grow">
            <p class="text-gray-700 font-bold">John Doe</p>
            <p class="text-gray-600">2 hours ago</p>
        </div>
        <div class="flex-shrink-0">
            <button class="text-gray-600 hover:text-gray-800">
                <i class="fas fa-ellipsis-h"></i>
            </button>
        </div>
    </div>
    <h2 class="text-lg font-medium mb-4">What's your favorite color?</h2>
    <form class="space-y-2">
        <div class="flex items-center  gap-3">
            <input id="color1" type="radio" name="color"
                class="appearance-none h-4 w-4 border border-gray-300 rounded-full checked:bg-blue-500 checked:border-transparent focus:outline-none">
            <label for="color1" class="text-gray-700">Blue</label> 
            <p class="text-blue-600 font-bold"> 75% voted for this</p>
        </div>
        <div class="flex items-center gap-3">
            <input id="color2" type="radio" name="color"
                class="appearance-none h-4 w-4 border border-gray-300 rounded-full checked:bg-red-500 checked:border-transparent focus:outline-none">
            <label for="color2" class="text-gray-700 ">Red</label>
            <p class=" text-blue-600  font-bold"> 25% voted for this</p>
        </div>
        <div class="flex items-center space-x-2">
            <input type="text"
                class="basis-4/6 w-full border border-gray-300 rounded-lg py-2 px-4 focus:outline-none focus:border-blue-500"
                placeholder="Add poll option">
            <button
                class="basis-2/6 bg-blue-500 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg ml-2">Add
                option</button>
        </div>
    </form>
</div>
    `;
}
function clear_attachment_view() {
    attachment_view.innerHTML = "";

}
function render_attachment_view() {
    clear_attachment_view();
    let file_template = `<div
    class=" attachment-view-item relative p-2 w-20 inline-block h-full bg-gray-400 rounded-sm text-clip overflow-hidden ...">
    <i class="fa-solid fa-file fa-xl hover:cursor-pointer" style="color: #025cf7;"></i>
    <p class="font-semibold"> {filename}</p>
    <div onclick='remove_from_attachment_list("{filename}")' class=" attachment_view_item absolute top-0 right-0 h-6 w-6  border-2 border-white rounded-full bg-red-400 z-2">
    </div>
</div>`;
    let photo_template = `<div
class="attachment-view-item relative  p-2 w-20 inline-block h-full bg-gray-400 rounded-sm text-clip overflow-hidden ...">

<div class="font-semibold"> <img src="{photo}"> </img></div>
<div onclick='remove_from_attachment_list("{filename}")' class="attachment_view_item absolute top-0 right-0 h-6 w-6  border-2 border-white rounded-full bg-red-400 z-2">
</div>
</div>`;

    post_attachment_list.forEach(({ file_name, file_type, file_data }) => {
        if (file_type.startsWith('image/')) {

            let img_src = `data:${file_type};base64,${file_data}`;
            let final_template = photo_template.replace(/{([^{}]+)}/g, function (keyExpr, key) {

                if (key === "photo") {
                    return img_src;
                }
                else if (key === "filename") {
                    return file_name;
                }



            });
            attachment_view.innerHTML = attachment_view.innerHTML + final_template;


        }
        else {
            let final_template = file_template.replace(/{([^{}]+)}/g, function (keyExpr, key) {

                if (key === "filename") {
                    return file_name;
                }
            });
            attachment_view.innerHTML = attachment_view.innerHTML + final_template;
        }
    });

}
function remove_from_attachment_list(input_file_name) {
    console.log("input file name for removal ", input_file_name);
    post_attachment_list = post_attachment_list.filter((post_attachment_item) => {
        console.log("post_attachment_item ", post_attachment_item.file_name, input_file_name);
        if (input_file_name == post_attachment_item.file_name)
            return false;
        return true;
    });
    console.log("filtered attachment list items ", post_attachment_list);
    clear_attachment_view();
    render_attachment_view();

}
function open_post_attachment_view() {
    if (attachment_view.classList.contains('hidden'))
        attachment_view.classList.remove('hidden');
    post_file_chooser.click();
}
function close_post_attachment_view() {
    if (!attachment_view.classList.contains('hidden'))
        attachment_view.classList.add('hidden');
}
post_file_chooser.addEventListener('change', (event) => {
    const files = Array.from(event.target.files);
    /*
    let file_names = files.map((file) => {
        const stripped_filename = file.name.split('.').slice(0, -1).join('.');;
        const prefix = [user_id, current_friend.id].sort().join('-');
        return prefix + stripped_filename;
    })
    */


    const promises = files.map((file) => {
        //let stripped_filename = file.name.split('.').slice(0, -1).join('.');
        const prefix = user_id;
        let stripped_filename = prefix + file.name;
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = () => {
                const fileData = reader.result.split(',')[1];
                resolve({ file_name: stripped_filename, file_type: file.type, file_data: fileData });
            };

            reader.readAsDataURL(file);
        });
    });

    Promise.all(promises).then((files) => {
        //socket.emit('sendFiles', { files });
        files.forEach((file) => {
            post_attachment_list.push(file);
        });

        console.log("Attachment list items ", post_attachment_list);
        render_attachment_view();
    });

});
function clear_post_input() {
    post_content_input.value = "";
}
function clear_search_bar_input() {
    live_search_bar.value = "";
}
function prevent_form_default(event) {
    event.preventDefault();
}
function search_for_users(param) {
    axios.get('https://192.168.1.187:3000/users/search', {
        params: {
            'search': param,
            'page': 1,
            'limit': 10

        }
    })
        .then(function (response) {
            console.log(response.data);
            live_search_list = response.data;
            display_live_search_container();
            clear_search_bar_input()
        })
        .catch(function (error) {
            console.log(error);
        });
}

function send_post() {
    let data = {
        user_id,
        content: post_content_input.value || "",
        files: post_attachment_list,
        type: "post",

    }


    axios.post('https://192.168.1.187:3000/posts', data)
        .then(function (response) {
            console.log(response);
            clear_post_input()
        })
        .catch(function (error) {
            console.log(error);
        });



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
function toggle_live_search_container() {
    if (live_search_container.classList.contains('hidden')) {
        display_live_search_container();
    }
    else {
        close_live_search_container();
    }
}
function display_message_container() {
    message_container.classList.remove("hidden")
}
function render_live_search_results() {
    live_search_content_container.innerHTML = "";
    let final_html = "";
    template = `
    <div onclick=""
                    class="friend-item flex p-1 bg-violet-100 items-center hover:cursor-pointer  rounded-md  items-center justify-between flex-row">
                    <div class="user-photo-round-small relative w-16 h-16 mr-4">
                        <img class="rounded-full border w-16 h-16 border-gray-100 shadow-sm"
                            src="{photo_path}" />
                        <div
                            class="friendlist_online_indicator absolute top-0 right-0 h-4 w-4 my-1 border-2 border-white rounded-full {isOnline} z-2">
                        </div>
                    </div>
                    <div class="user-name-last-message flex flex-col">
                        <p class="username font-bold text-lg">
                            {username}
                        </p>
                        <p class="gender font-bold text-md">
                            {gender}
                        </p>

                    </div>
                    <div>
                        <button onclick="send_friend_request({id})"class="bg-blue-600 hover:bg-blue-800 p-2 text-white rounded-md"> Send Request  </button>
                    </div>

                </div>
    `;
    live_search_list.forEach((live_search_item) => {
        let final_template = template.replace(/{([^{}]+)}/g, function (keyExpr, key) {

            if (key === "isOnline") {
                return "bg-green-600";
            }
            else if (key == "photo_path") {
                return "https://picsum.photos/600/400";
            }
            else {
                return live_search_item[key] || "";
            }


        });
        //console.log("template", friend_template);
        final_html = final_html + final_template;
    });
    live_search_content_container.innerHTML = final_html;
}
function display_live_search_container() {
    live_search_container.classList.remove('hidden');
    render_live_search_results();
}
function close_live_search_container() {
    live_search_container.classList.add('hidden');
}
function close_message_container() {
    message_container.classList.add("hidden")
}
function fetch_friend_requests() {
    axios.get('https://192.168.1.187:3000/friend_requests', {
        params: {
            id: user_id,
            page: 1,
            limit: 10
        }
    })
        .then(function (response) {
            console.log(response.data);
            friend_request_list = response.data;
            render_friend_request_list();

        })
        .catch(function (error) {
            console.log(error);
        });
}
function fetch_notifications() {
    axios.get('https://192.168.1.187:3000/notifications', {
        params: {
            id: user_id,
            page: 1,
            limit: 50
        }
    })
        .then(function (response) {
            console.log(response.data);
            notifications_list = response.data;
            render_notifications_list();

        })
        .catch(function (error) {
            console.log(error);
        });
}
fetch_notifications();
function render_posts_container() {

}

function send_friend_request(id) {
    console.log("sent friend request to ", id)
    axios.post('https://192.168.1.187:3000/friend_requests', {
        to_user_id: id,
        from_user_id: user_id
    })
        .then(function (response) {
            console.log(response);

        })
        .catch(function (error) {
            console.log(error);
        });
}
fetch_friend_requests();
render_top_places_list();
render_friend_request_list();