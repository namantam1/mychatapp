(function () {
  const { createStore } = Redux;
  const encodeRoomId = id => `room_${id}`
  const decodeId = id => parseInt(id.split("_")[1])
  const encodeChatId = id => `chat_${id}`
  let test;

  // const init_chat = {}
  // Actions
  const ACTIONTYPE = {
    addChat: 'addChat',
    updateChat: 'updateChat'
  }

  function counterReducer(state = {}, action) {
    if (action.type == ACTIONTYPE.addChat) {
      var roomId = encodeRoomId(action.payload.roomId)
      return {
        ...state,
        [roomId]: {
          ...state[roomId],
          ...action.payload
        }
      }
    }
    else if (action.type == ACTIONTYPE.updateChat) {
      const data = action.payload
      const id = encodeChatId(data.chatId)
      return {
        ...state,
        [id]: data
      }
    }
    return state;
  }

  let store = createStore(counterReducer);


  var chat = {
    roomName: "",
    userId: self_user_id,
    userName: "",
    userImage: "",
    userOnline: true,
    userLastSeen: "",
    roomId: 0,
    rooms: [],
    encodedRoomId: encodeRoomId(this.roomId),
    initialState: [],
    messageToSend: '',
    messageResponses: [],
    actionType: ACTIONTYPE,
    chatSocket: new ReconnectingWebSocket(
      'ws://'
      + window.location.host
      + '/ws/chat/'
    ),
    init: function () {
      this.renderOnLoad();
      this.cacheDOM();
      this.bindEvents();
      // this.render();
    },
    refresh: function() {
      this.cacheDOM();
      this.bindEvents();
      console.log(this)
    },
    cacheDOM: function () {
      this.$chatHistory = $('.chat-history');
      this.$button = $('button');
      this.$textarea = $('#message-to-send');
      this.$chatHistoryList = this.$chatHistory.find('ul');
      this.$topHeader = $('.chat-header')
      this.$sidebar = $('#people-list ul')
      this.$peopleList = document.querySelectorAll('.people-list ul li')
    },
    bindEvents: function () {
      const that = this;
      this.$button.on('click', this.addMessage.bind(this));
      this.$textarea.on('keyup', this.addMessageEnter.bind(this));
      this.$peopleList.forEach(value => value.addEventListener('click', function () { that.listClick.bind(that)(this); }));
      this.chatSocket.onmessage = function (e) { that.newMessage.bind(that)(e, this); };
    },
    setState: function(id) {
      // console.log(this)
      var room = store.getState()[encodeRoomId(id)]
      this.encodedRoomId = encodeRoomId(id);
      this.roomId = parseInt(id);
      this.userName = room.user.name;
      this.userImage = room.user.image;
      this.userOnline = room.user.online;
      this.userLastSeen = room.user.lastSeen;
      // console.log(this)
    },
    newMessage: function (event, self) {
      if (event.hasOwnProperty('data')) {
        // console.log(event.data);
        var message = JSON.parse(event.data);
        // console.log(message, this);
        if(message.type === "message"){
          message = message.message;
          if (message.hasOwnProperty('roomId')) {
            if (message.roomId == this.roomId) {
              this.render(message);
            }
            this.serialize_chat(message);
            // console.log(store.getState())
          }
        }else if(message.type === 'status') {
          console.log(message.message);
        } else {
          console.log(message);
        }
      }
    },
    listClick: function (event) {
      // console.log(this, event)
      // test = store
      // test = this;
      
      if (event.dataset.hasOwnProperty('room')) {
        this.$peopleList.forEach(e => e.classList.remove('active'))
        event.classList.add('active')
        const roomId = event.dataset.room;
        this.setState(roomId)
        this.renderHeader();
        const chats = store.getState()[this.encodedRoomId]

        // console.log(roomId, this.roomId)
        this.$chatHistoryList.html("");
        for (const key in chats) {
          if (chats.hasOwnProperty(key)) {
            const element = chats[key];
            if (element.hasOwnProperty('text')) {
              this.render(element);
            }
          }
        }
      }
      // console.log(test)
    },
    serialize_room: function (element) {
      if (element.hasOwnProperty('id')) {
        var user = {}
        var doubts = {}
        if (element.hasOwnProperty('student')) {
          if (element.student) {
            // console.log(element.student)
            if (element.student.id != this.userId) {
              user.id = element.student.id,
                user.name = element.student.email,
                user.image = element.student.image
                user.lastSeen = element.student.lastSeen,
                user.online  =element.student.online
            }
          }
        }
        if (element.hasOwnProperty('teacher')) {
          if (element.teacher) {
            // console.log(element.teacher)
            if (element.teacher.id != self_user_id) {
              user.id = element.teacher.id,
                user.name = element.teacher.email,
                user.image = element.teacher.image,
                user.lastSeen = element.teacher.lastSeen,
                user.online  =element.teacher.online
            }
          }
        }
        if (element.hasOwnProperty('user')) {
          user = element.user;
        }
        if (element.hasOwnProperty('doubt')) {
          element.doubt.forEach(ele => {
            // console.log(ele)
            if (ele.hasOwnProperty('doubtId')) {
              doubts[`chat_${ele.doubtId}`] = ele
            }
          })
        }
        // console.log(doubts)
        store.dispatch({
          type: ACTIONTYPE.addChat,
          payload: {
            roomId: element.id,
            user: user,
            ...doubts
          }
          // console.log(payload)
        })
      }
    },
    serialize_rooms: function (chats) {
      chats.forEach(element => this.serialize_room(element));
    },
    serialize_chat: function (chat) {
      if (chat.hasOwnProperty('roomId') && chat.hasOwnProperty("doubtId")) {
        var roomId = chat.roomId;
        var doubtId = chat.doubtId;
        store.dispatch({
          type: ACTIONTYPE.addChat,
          payload: {
            roomId: roomId,
            [`chat_${doubtId}`]: chat
          }
        });
      }
    },
    render: function (message) {
      this.scrollToBottom();
      if (message.text) {
        
        // data[`room_${message.roomId}`]['user']['id']
        // console.log(message.user, this.userId)
        console.log(message)
        var context = {
          text: message.text,
          name: message.user.name,
          time: message.timestamp,
          id: message.doubtId
        };
        if (message.user == this.userId) {
          // console.log('thiis is my message')
          var template = Handlebars.compile($("#message-template").html());
          this.$chatHistoryList.append(template(context));
        } else {
          var templateResponse = Handlebars.compile($("#message-response-template").html());
          this.$chatHistoryList.append(templateResponse(context));
        }
        this.scrollToBottom();
      }

    },
    renderHeader: function () {
      var template = Handlebars.compile($('#top-header-template').html());
      var context = {
        image: this.userImage,
        name: this.userName,
        online: this.userOnline,
        time: this.userLastSeen,
        id: this.roomId + '_header'
      }
      this.$topHeader.html(template(context));
    },
    renderSidePanel: function(data) {
      var template = Handlebars.compile($('#side-panel-template').html());
      // console.log(data, template)
      var context = {
        image: data.image,
        name: data.name,
        roomId: data.roomId,
        online: data.online,
        time: data.lastSeen,
        id: data.roomId + "_side-panel"
      }
      this.$sidebar.append(template(context));

    },
    addMessage: function () {
      // console.log(this)
      this.messageToSend = this.$textarea.val();
      if (this.messageToSend && this.roomId != 0) {
        this.chatSocket.send(JSON.stringify({
          'text': this.messageToSend,
          'roomId': this.roomId
        }));
        // this.render();    
        this.$textarea.val("")
      }
    },
    addMessageEnter: function (event) {
      // enter was pressed
      if (event.keyCode === 13) {
        this.addMessage();
      }
    },
    scrollToBottom: function () {
      this.$chatHistory.scrollTop(this.$chatHistory[0].scrollHeight);
    },
    getCurrentTime: function () {
      return new Date().toLocaleTimeString().
        replace(/([\d]+:[\d]{2})(:[\d]{2})(.*)/, "$1$3");
    },
    renderOnLoad: function () {
      document.addEventListener('DOMContentLoaded', () => {
        fetch('/room/')
          .then(res => res.json())
          .then(data => {
            // console.log(data, this);
            this.initialState = data;
            this.serialize_initial_data();
          })
          .catch(err => console.log(err))
      })
    },
    serialize_initial_data: function () {
      this.serialize_rooms(this.initialState);

      // console.log(this.initialState);
      var rooms = store.getState();
      console.log(rooms)
      for (const room in rooms) {
        if (rooms.hasOwnProperty(room)) {
          const element = rooms[room];
          // console.log(element)
          this.renderSidePanel({
            roomId: element.roomId,
            name: element.user.name,
            image: element.user.image,
            lastSeen: element.user.lastSeen,
            online: element.user.online
          })
        }
      }
      this.refresh();
      // for (const room in this.initialState) {
      //   if (this.initialState.hasOwnProperty(room)) {
      //     const element = this.initialState[room];
      //     if (!element.id in this.rooms) {
      //       this.rooms.push(element.id);
      //     }
      //   }
      // }
    }
  };

  test = chat.init();

  var searchFilter = {
    options: { valueNames: ['name'] },
    init: function () {
      var userList = new List('people-list', this.options);
      var noItems = $('<li id="no-items-found">No items found</li>');

      userList.on('updated', function (list) {
        if (list.matchingItems.length === 0) {
          $(list.list).append(noItems);
        } else {
          noItems.detach();
        }
      });
    }
  };

  searchFilter.init();

})();