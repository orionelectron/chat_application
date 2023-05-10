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
let newsfeed_container = document.getElementById("newsfeed_container");
let friendlist_container = document.getElementById('friendlist_container')
const user_id = document.getElementById('user_id').value || 123;
const token = document.getElementById('token').value || '1234';

let post_attachment_list = [];
let live_search_list = [];
let friend_request_list = [];
let friends_list = [];
let notifications_list = [];
let newsfeed_list = [];
let top_places_list = [
    {
        id: 1,
        name: "Bharatpur",
        description: "This is a good tourist destination for those who want to live their best life",
        photo_path: "https://picsum.photos/600/400",
        location: "chitwan",
        rating: 5

    },
];



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

function bootstrap() {
    fetch_newsfeed();
    fetch_friend_requests();
    fetch_friend_list();
    fetch_notifications();
    fetch_top_places();
}
function fetch_newsfeed() {
    let newsfeed_url = 'https://192.168.1.187:3000/newsfeed_data';
    let params = {
        id: user_id,
        page: 1,
        limit: 50
    }
    console.log("fetching newsfeed");

    let newsfeed_data = fetch_with_get(newsfeed_url, params, newsfeed_list, render_newsfeed);
    console.log("Fetched newsfeed data ", newsfeed_data);
}
function fetch_friend_list() {
    console.log("fetching friend list");
    let friend_list_url = 'https://192.168.1.187:3000/friends';
    let params = {
        id: user_id,
    }
    console.log("fetching friend list");

    fetch_with_get(friend_list_url, params, friends_list, render_friend_list);

}
function fetch_notifications() {
    let notifications_url = 'https://192.168.1.187:3000/notifications';
    let params = {
        id: user_id,
        page: 1,
        limit: 50
    }
    console.log("fetching notifications");
    fetch_with_get(notifications_url, params, notifications_list, render_notifications);

}
function fetch_friend_requests() {
    let friend_requests_url = 'https://192.168.1.187:3000/friend_requests';
    let params = {
        id: user_id,
        page: 1,
        limit: 10
    }
    console.log('fetching friend requests');
    fetch_with_get(friend_requests_url, params, friend_request_list, render_friend_requests);
}
function fetch_top_places() {
    render_top_places();
}
function fetch_live_search() {
    console.log("fetching live search data")
}
function fetch_with_get(url, params, target = null, callback = null) {

    axios.get(url, {
        params: {
            ...params

        }

    }).then((result) => {
        if (target) {
            console.log("target", target)
            if (result.data)
                target.push(...result.data);
            else
                target.push(result);
        }


        if (callback != null)
            callback();

    })
        .catch((error) => {
            console.log("Error ", error)
        });





}
async function send_with_post(url, body, target = null, callback = null) {

    await axios.post(url, body).then((result) => {
        if (target) {
            console.log(target, "target")
            if (result.data)
                target.push(...result.data);
            else
                target.push(result);
        }
        console.log("post result", result)
        if (callback)
            callback();

    }).catch((error) => {
        console.log("Error ", error)
    });




}
function get_photo_grid(post_photo_urls) {
    if (!post_photo_urls)
        return ""
    console.log(post_photo_urls)
    let photo_urls = post_photo_urls.split(',').map(url => url.trim());
    let final_html = '';
    let template = `<img class="w-full h-full object-cover" src="{post_photo_url}.png">`
    for (let i = 0; i < photo_urls.length; i++) {
        let final_template = template.replace(/{([^{}]+)}/g, function (keyExpr, key) {

            if (key == 'post_photo_url')
                return photo_urls[i];


        });
        final_html = final_html + final_template;
    }
    return final_html;
}
function render_top_places() {
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

function render_newsfeed() {
    final_html = '';
    let template = `
    <div class="bg-white rounded-lg shadow-lg overflow-hidden">
    <div class="p-4">
        <div class="flex space-x-4">
            <div class="flex-shrink-0">
            <img class="h-12 w-12 rounded-full object-cover" src="{profile_picture_path}"></img>
            </div>
            <div class="flex-grow">
                <p class="text-gray-700 font-bold">{username}</p>
                <p class="text-gray-600">{created_at}</p>
            </div>
            <div class="flex-shrink-0">
                <button class="text-gray-600 hover:text-gray-800">
                    <i class="fas fa-ellipsis-h"></i>
                </button>
            </div>
        </div>
        <div class="my-2">
            <p class="text-gray-800 font-medium">{post_content}</p>
        </div>
        <div class="my-4 w-full h-80 grid grid-cols-2 gap-4">
           {photo_grid}
        </div>
        
        <div class="flex justify-between my-4">
            <div class="flex items-center space-x-2">
                <button class="text-gray-600 hover:text-blue-600">
                    <i class="far fa-thumbs-up"></i>
                </button>
                <p class="text-gray-600">{likes_count} likes</p>
            </div>
            <div class="flex items-center space-x-2">
                <button class="text-gray-600 hover:text-blue-600">
                    <i class="far fa-comment"></i>
                </button>
                <p class="text-gray-600">{comment_count} comments</p>
            </div>
            <div class="flex items-center space-x-2">
                <button class="text-gray-600 hover:text-blue-600">
                    <i class="far fa-share-square"></i>
                </button>
                <p class="text-gray-600">10 shares</p>
            </div>
        </div>
        <div class="flex justify-between">
            <button class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-full">
                Like
            </button>
            <button class="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-full">
                Comment
            </button>
            <button class="bg-violet-500 hover:bg-violet-700 text-white font-bold py-2 px-4 rounded-full">
                Share
            </button>
        </div>
    </div>
</div>
    `;
    for (let i = 0; i < newsfeed_list.length; i++) {
        let final_template = template.replace(/{([^{}]+)}/g, function (keyExpr, key) {
            // console.log(newsfeed_list[i])

            if (key == 'photo_grid')
                return get_photo_grid(newsfeed_list[i].post_photo_urls);
            else
                return newsfeed_list[i][key]


        });
        final_html = final_html + final_template;
    }
    newsfeed_container.innerHTML = final_html;
}

function render_friend_requests() {
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
function render_friend_list() {
    console.log("rendering friend_list")
    let final_html = '';
    let template = `
    <div onclick="select_friend({id})"
    class="friend-item flex hover:bg-gray-300 items-center hover:cursor-pointer  rounded-md  items-center flex-row">
    <div class="user-photo-round-small relative w-16 h-16 mr-4">
        <img class="rounded-full border w-16 h-16 border-gray-100 shadow-sm"
            src="{profile_picture_path}" />
        <div
            class="friendlist_online_indicator absolute top-0 right-0 h-4 w-4 my-1 border-2 border-white rounded-full bg-green-700 z-2">
        </div>
    </div>
    <div class="user-name-last-message flex flex-col">
        <p class="username font-bold text-lg">
            {username}
        </p>
        <p> {time_ago}</p>

    </div>

</div>
    `;
    for (let i = 0; i < friends_list.length; i++) {
        let friend = friends_list[i];

        let final_template = template.replace(/{([^{}]+)}/g, function (keyExpr, key) {


            if (key === "time_ago") {
                return timeAgo(friend.timestamp);
            }
           
            else {
                return friend[key] || "";
            }


        });
        //console.log("template", friend_template);
        final_html = final_html + final_template;
    }
    friendlist_container.innerHTML = final_html;
}
function toggle_notification_container() {
    if (notification_container.classList.contains("hidden")) {
        display_notification_container();
        render_notifications();
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
function render_notifications() {
    console.log("rendering notifications");
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
        console.log(notification)

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

function render_live_search_results() {
    fetch_live_search();
}



function accept_friend_request() {
    render_friend_requests();
}
function reject_friend_request() {
    render_friend_requests();
}

function like_post(post_id) {

}

function share_post(post_id) {

}

function comment_post(post_id) {

}

function create_post() {
    send_with_post();
    render_newsfeed();

}


bootstrap();
