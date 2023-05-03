
let attachment_view = document.getElementById("attachment-view");
let chat_details_section = document.getElementById('chat-details-section')
let friendlist_section = document.getElementById("friendlist-section")
let current_selected_friend = document.getElementById('current-selected-friend');
let user_message_input = document.getElementById('user_message_input');
let message_container = document.getElementById('messages');

let attachments_list = [];
let messageStore = {};
let unseen_message = {};
let messages = [];
const user_id = document.getElementById('user_id').value || 123;
let current_friend = "";
console.log("user id", user_id)
const token = document.getElementById('token').value || '1234';
let friends_list = [];
let friend_typing_count = 0;

const socket = io("https://localhost:3000", { query: { token, user_id }, rejectUnauthorized: false });

socket.on('user-connected', (friend_id) => {
    console.log("user connected!!")
    set_friends_status(friend_id, true);
    notify_self_status(user_id, friend_id);
    console.log(friends_list);
    render_friendlist();
    select_friend_heading_render(current_friend.id);
})

function set_friends_status(friend_id, status) {
    for (let i = 0; i < friends_list.length; i++) {
        if (friends_list[i].id == friend_id) {
            friends_list[i].isOnline = status;
        }
    }
}


function notify_self_status(user_id, friend_id) {
    socket.emit("notify-self-status", { from: user_id, to: friend_id });
}

socket.on('user-disconnected', (friend_id) => {
    console.log("user disconnected", friend_id);
    set_friends_status(friend_id, false);
    console.log(friends_list);
    render_friendlist();
    select_friend_heading_render(current_friend.id);
})

socket.on('friend-notify-status', (data) => {
    set_friends_status(data.from, true)
    render_friendlist();
    if (current_friend.id == data.from) {
        select_friend_heading_render(current_friend.id);
    }
})

socket.on('chat-message', (message) => {
    console.log("received message", message);

    if (message.message != "Typing") {
        friend_typing_count = 0;
        reset_typing_animation();
        set_message_store(message, message.from);
        set_unseen_status(message);
        set_friendlist_lastname_indicator();
        console.log("unseen Message", unseen_message);
        render_messages(message);

        console.log("messsage store", messageStore);



    }
    else {
        if (message.from == current_friend.id) {
            render_typing_animation();

            friend_typing_count++;
        }

    }


})

function set_message_store(message, user_id) {
    if (messageStore[user_id]) {
        const timestamp = new Date().getTime();
        messageStore[user_id].push({ ...message, timestamp: timestamp });
    }
    else {
        messageStore[user_id] = [];
        const timestamp = new Date().getTime();
        messageStore[user_id].push({ ...message, timestamp: timestamp });
    }
}

function set_unseen_status(message) {
    if (message.from == current_friend.id) {
        unseen_message[current_friend.id] = false;
    }
    else {
        unseen_message[message.from] = true;

    }
}

function set_friendlist_lastname_indicator() {
    template = `
    <p class="last-message {text-color} font-medium">
        {lastMessage} <span class="text-gray-900"> {last_active} m</span>
    </p>`;
    let lastmessageindicators = document.getElementsByClassName("last-message");
    let unseen_round_indicator = document.getElementsByClassName("unseen_round_indicator");
    for (let i = 0; i < lastmessageindicators.length; i++) {
        let last_message_indicator = lastmessageindicators[i];
        console.log("friends_list", friends_list[0], i);
        if (!friends_list[i]) {
            return;
        }
        let last_message = get_last_message_of_friend(friends_list[i].id);
        if (last_message) {
            let final_template = template.replace(/{([^{}]+)}/g, function (keyExpr, key) {
                if (key === 'lastMessage')
                    return last_message.message;
                if (key == 'last_active')
                    return "20 ";
                if (key == 'text-color') {
                    if (unseen_message[friends_list[i].id]) {
                        unseen_round_indicator[i].classList.remove('hidden');
                        return 'text-sky-500';
                    }
                    console.log("unseen_round_indicator", unseen_round_indicator[i]);
                    unseen_round_indicator[i].classList.add('hidden');
                    return 'text-gray-500';

                }
                else {
                    return friend[key] || "";
                }


            });
            last_message_indicator.innerHTML = final_template;

        }
    }
}
function get_last_message_of_friend(friend_id) {

    let messages = get_friend_message(friend_id);
    if (messages) {
        return messages[messages.length - 1];
    }
}



fetch_friends();


function joinconversation(from_user, to_user) {
    socket.emit('join-room', { from_user, to_user });
}

function clear_messages() {
    message_container.innerHTML = "";
}

function reset_typing_animation() {
    let indicators = document.getElementsByClassName("typing-indicator");
    for (let i = 0; i < indicators.length; i++) {
        indicators[i].remove();
    }
}

function send_message(value = "") {

    let message_data = {};
    if (value) {
        message_data = { message: value, from: user_id, to: current_friend.id }
    }
    else {
        message_data = { message: user_message_input.value, from: user_id, to: current_friend.id }
        render_message(message_data);
    }
    if (message_data.message != "Typing")
        set_message_store(message_data, current_friend.id);
    console.log("message store aftr send message", messageStore);


    socket.emit("chat-message", message_data);
}

function request_peer_room_join() {
    socket.emit("request-peer-room-join", { from: user_id, to: current_friend.id });
}

function render_friendlist() {
    let final_html = ""
    let friend_template = `
    <div
                onclick="select_friend({id})"
                class="friend-item flex hover:bg-gray-300 items-center hover:cursor-pointer  rounded-md  items-center flex-row">
                <div class="user-photo-round-small relative w-16 h-16 mr-4">
                    <img class="rounded-full border border-gray-100 shadow-sm" src="{photo_picture_path}" />
                    <div
                        class="friendlist_online_indicator absolute top-0 right-0 h-4 w-4 my-1 border-2 border-white rounded-full {isOnline} z-2">
                    </div>
                </div>
                <div class="user-name-last-message flex flex-col">
                    <p class="username font-bold text-lg">
                        {username}
                    </p>
                    <p class="last-message text-sky-600 font-medium">
                        {lastMessage} <span class="text-gray-900"> {last_active} m</span>
                    </p>
                </div>
                <div class="w-4 h-4 unseen_round_indicator rounded-full ml-auto bg-blue-600"> </div>
            </div>
    
    `;

    for (let i = 0; i < friends_list.length; i++) {
        let friend = friends_list[i];
        let individual_template = friend_template;
        let final_template = individual_template.replace(/{([^{}]+)}/g, function (keyExpr, key) {

            if (key === "isOnline" && friend[key] == true) {
                return "bg-green-600";
            }
            else if (key === "isOnline" && friend[key] == false) {
                return "bg-red-600";
            }
            else {
                return friend[key] || "";
            }


        });
        //console.log("template", friend_template);
        final_html = final_html + final_template;
    }
    //console.log(final_html);
    friendlist_section.innerHTML = final_html;
    //select_friend(friends_list[0].id);
    set_friendlist_lastname_indicator();
}

function find_friend(user_id) {
    for (let i = 0; i < friends_list.length; i++) {
        console.log("user", user_id, friends_list[i]);
        if (friends_list[i].id == user_id) {

            return friends_list[i];
        }
    }
    return null;

}

function render_messages() {
    clear_messages();
    let messages = get_friend_message(current_friend.id);
    for (let i = 0; i < messages.length; i++) {
        render_message(messages[i]);
    }

}

function get_friend_message(friend_id) {
    let messages = messageStore[friend_id];
    if (!messages) {
        return [];
    }
    console.log(messages)


    let mergedMessages = messages

    mergedMessages.sort((a, b) => {
        if (a.timestamp < b.timestamp) {
            return -1;
        } else if (a.timestamp > b.timestamp) {
            return 1;
        } else {
            return 0;
        }
    });
    return mergedMessages;
}

function render_typing_animation() {
    typing_template = `
    <div id="typing-indicator" class="typing-indicator ml-4 mt-4  flex items-center">
    <div class="animate-typing h-2 w-2 rounded-full bg-blue-500 mr-1"></div>
    <div class="animate-typing h-2 w-2 rounded-full bg-blue-500 mr-1"></div>
    <div class="animate-typing h-2 w-2 rounded-full bg-blue-500"></div>
  </div>
  
    `;

    if (friend_typing_count == 0) {
        message_container.innerHTML = message_container.innerHTML + typing_template;
        console.log("typing");

    }

    return;

}

function render_message(message) {
    message_template = `
    <div class="flex flex-col {orientation}">
    <div class="flex gap-2">
        <img class="rounded-full w-8 h-8 border border-gray-100 shadow-sm"
            src="https://picsum.photos/300/300" />
        <p class="{message_color} text-white rounded-full p-2 font-semibold">
            {message}
        </p>
    </div>

    <p class="text-gray-500 ml-10"> {message_date}</p>
</div>
    `;


    let final_template = message_template.replace(/{([^{}]+)}/g, function (keyExpr, key) {
        if (key == 'orientation') {
            if (message.to == user_id) {
                return 'items-start'
            }
            return 'items-end'
        }
        if (key == 'message_color') {
            if (message.to == user_id) {
                return 'bg-violet-900'
            }
            return 'bg-sky-500'
        }
        else if (key == "message") {
            return message.message;
        }
        else {
            return new Date().toLocaleDateString("en-US")
        }


    });
    message_container.innerHTML = message_container.innerHTML + final_template;
}

function inform_user_typing(friend) {

    send_message("Typing");


}

function select_friend(friend_id) {
    unseen_message[friend_id] = false;
    select_friend_heading_render(friend_id);
    joinconversation(user_id, friend_id);

    clear_messages();

    render_messages();
    set_friendlist_lastname_indicator();

}

function select_friend_heading_render(friend_id) {
    if (!current_friend.id == friend_id)
        clear_messages();

    let template = `
    <div class="user-photo-round-small relative w-8 h-8 mr-4">
    <img class="rounded-full border border-gray-100 shadow-sm"
        src="{photo_picture_path}" />
    <div
        class="absolute top-0 right-0 h-3 w-3 my-1 border-2 border-white rounded-full {isOnline} z-2">
    </div>
</div>
<div class="user-name-last-message flex flex-col">
    <p id="current-selected-friend-label" class="username font-bold text-lg">
        {username}
    </p>
    <p id="current-selected-friend-status" class="last-message text-gray-600 font-medium">
        {last_active}
    </p>
</div>
    `;

    let friend = find_friend(friend_id);
    current_friend = friend;

    //console.log(friend);
    let individual_template = template;
    let final_template = individual_template.replace(/{([^{}]+)}/g, function (keyExpr, key) {

        if (key === "isOnline" && friend[key] == true) {
            return "bg-green-600";
        }
        else if (key === "isOnline" && friend[key] == false) {
            return "bg-red-600";
        }
        else {
            return friend[key] || "";
        }


    });
    // console.log("template", final_template);
    current_selected_friend.innerHTML = final_template;



}

function close_attachment_view() {
    if (!attachment_view.classList.contains('hidden'))
        attachment_view.classList.add('hidden');
}

function fetch_messages(userId) {
    const data = {
        source_user_id: user_id,
        dest_user_id: 12


    };

    const options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    };

    fetch('https://localhost:3000/messages', options)
        .then(response => response.json())
        .then(data => {
            // Process the data
            console.log(data);

        })
        .catch(error => {
            console.error('Error fetching data:', error);
        });
}

async function fetch_friends(userId) {
    const data = {
        id: userId,

    };

    const options = {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    };

    fetch('https://localhost:3000/friends?user_id=' + user_id,)
        .then(response => response.json())
        .then(data => {
            // Process the data
            console.log(data);
            friends_list = data;
            render_friendlist();
            select_friend(friends_list[0].id);

        })
        .catch(error => {
            console.error('Error fetching data:', error);
        });

}
function open_attachment_view() {
    if (attachment_view.classList.contains('hidden'))
        attachment_view.classList.remove('hidden');

}

function open_chat_details() {
    if (chat_details_section.classList.contains('hidden'))
        chat_details_section.classList.remove('hidden');
    else
        chat_details_section.classList.add('hidden');
}


function friendClicked(friendName) {


}