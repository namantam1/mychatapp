const encodeRoomId = e => 'room_' + e;
var isTabActive = true
const audio = new Audio('/static/sound.mp3');

function playSound() {
    audio.play()
    .then()
    .catch(e => {
        //
    })
}

window.onfocus = function () { 
    isTabActive = true; 
  }; 
  
  window.onblur = function () { 
    isTabActive = false;
  }; 

function ListItem(props) {
    let status;
    if (props.value.user.online) {
        status = <div><i className="fa fa-circle online" /> Online</div>
    } else {
        status = <div><i className="fa fa-circle offline" /> offline</div>
    }
    return (
        <li className={props.value.isActive ? 'clearfix active' : 'clearfix'}
            data-room={props.value.roomId} onClick={() => props.action(props.value.roomId, true)}>
            <img src={props.value.user.image} alt="avatar" />
            <div className="about">
                <div className="name">Chat-{props.value.roomId}</div>
                <div className="status">
                    {status}
                </div>
            </div>
            {props.value.unseenCount !== 0 ? <small>{props.value.unseenCount}</small> : ""}
        </li>
    );
}

function Reply(props) {
    // console.log(props)
    return (
        <li className="clearfix" id="chat-id">
            <div className="message-data align-right">
                <span className="message-data-time">{props.value.timestamp}</span> &nbsp; &nbsp;
            <span className="message-data-name">{props.value.name}</span> <i className="fa fa-circle me" />
            </div>
            <div className="message other-message float-right">
                {props.value.text}
                <i className={props.value.seen ? 'fas fa-check-double status' : 'fas fa-check status'}></i>
            </div>
        </li>
    )
}
function Response(props) {
    return (
        <li id="chat-id">
            <div className="message-data">
                <span className="message-data-name"><i className="fa fa-circle online" /> {props.value.timestamp}</span>
                <span className="message-data-time">{props.value.name}</span>
            </div>
            <div className="message my-message">
                {props.value.text}
            </div>
        </li>
    )
}

function Chat(props) {
    // console.log(props.value, "Final chat")
    return (
        props.value.map(chat => {
            if (chat.user == self_user_id) {
                return <Reply value={chat} key={chat.doubtId} />;
            } else {
                return <Response value={chat} key={chat.doubtId} />;
            }
        })
    );
}

class SidePanel extends React.Component {
    constructor(props) {
        super(props);
        // this.state = {
        //     isActive: this.props.action
        // }
    }
    render() {
        // console.log(this.props.chats)
        return (
            <ul className="list scroll-slim">
                { Object.keys(this.props.chats).map(key =>
                    <ListItem key={key} value={this.props.chats[key]}
                        action={this.props.action} />
                )}
            </ul>
        );
    }
}

class Header extends React.Component {
    componentDidUpdate() {
        // this.scrollToBottom();
        // console.log(this.props.chat)
        if (this.props.chat) {
            this.scrollToBottom();
            // console.log('Scrolled')
            // console.log(this.props.updateSeen)
            // console.log('Header update')
            // this.props.updateSeen()
        }
    }

    scrollToBottom = () => {
        this.messagesEnd.scrollIntoView({ behavior: "smooth" });
    }

    render() {
        const chat = this.props.chat
        let status;
        // console.log(this.props.chat, "chat")
        if (chat) {
            if (chat.user.online) {
                status = <div><i className="fa fa-circle online" /> Online</div>
            } else {
                status = <div className="chat-num-messages">last seen {chat.user.lastSeen}</div>
            }
            return (
                <React.Fragment>
                    <div className="chat-header clearfix">
                        <img src={chat.user.image} alt="avatar" />
                        <div className="chat-about">
                            <div className="chat-with">{chat.user.name} Chat-{chat.roomId}</div>
                            {status}
                        </div>
                    </div>
                    <div className="chat-history scroll-slim">
                        <ul>
                            <Chat value={chat.chats} />
                        </ul>
                        <div style={{ float: "left", clear: "both" }}
                            ref={(el) => { this.messagesEnd = el; }}>
                        </div>
                    </div>
                </React.Fragment >
            );
        }
        return (
            <React.Fragment >
                <div className="chat-header clearfix">
                </div>
                <div className="chat-history scroll-slim">
                    <ul>
                    </ul>
                </div>
            </React.Fragment >
        );
    }
}

class Main extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            userId: self_user_id,
            chats: {},
            activePanel: "",
            activeRoomId: 0,
            textValue: ""
        };
        this.chatSocket = new ReconnectingWebSocket(
            'ws://'
            + window.location.host
            + '/ws/chat/'
        )
        this.handleSubmit = this.handleSubmit.bind(this);
        this.handleChange = this.handleChange.bind(this);
        this.submitOnEnter = this.submitOnEnter.bind(this);
        this.updateSeen = this.updateSeen.bind(this);
    }
    
    windowEvent = (event) => {
        // console.log("SSSSSSSSSSS", event, this)
        if(event.type == 'focus') {
            // console.log(event, 'focus')
            this.updateSeen();
        } else if(event.type == 'blur') {
            // console.log(event, 'blur')

        }
    }

    serialize_rooms(chats) {
        chats.forEach(element => this.serialize_room(element));
    }

    serialize_room(element) {
        if (element.hasOwnProperty('id')) {
            var user = {}
            var doubts = {}
            if (element.hasOwnProperty('student')) {
                if (element.student) {
                    // console.log(element.student)
                    if (element.student.id != this.state.userId) {
                        user.id = element.student.id,
                            user.name = element.student.email,
                            user.image = element.student.image
                        user.lastSeen = element.student.lastSeen,
                            user.online = element.student.online
                    }
                }
            }
            if (element.hasOwnProperty('teacher')) {
                if (element.teacher) {
                    // console.log(element.teacher)
                    if (element.teacher.id != this.state.userId) {
                        user.id = element.teacher.id,
                            user.name = element.teacher.email,
                            user.image = element.teacher.image,
                            user.lastSeen = element.teacher.lastSeen,
                            user.online = element.teacher.online
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
            const roomId = encodeRoomId(element.id)
            // console.log(roomId)
            this.setState({
                ...this.state,
                chats: {
                    ...this.state.chats,
                    [roomId]: {
                        roomId: element.id,
                        isActive: false,
                        unseenCount: element.unseenCount,
                        user: user,
                        chats: element.doubt
                    }
                }
            })
        }
    }

    updateLiveStatus(message) {
        const room = encodeRoomId(message.id)
        console.log(message)
        // console.log(message,room, "%%%%%%%")
        if (this.state.chats[room] && message.user.id !== this.state.userId) {
            this.setState({
                ...this.state,
                chats: {
                    ...this.state.chats,
                    [room]: {
                        ...this.state.chats[room],
                        user: {
                            ...this.state.chats[room].user,
                            ...message.user
                        }
                    }
                }
            })
            // console.log(this.state.chats, "New state after status upadte")
        }
    }

    componentDidMount() {
        fetch('/room')
            .then(res => res.json())
            .then(data => {
                // console.log(data)
                this.serialize_rooms(data);
                // this.setState({
                //     ...this.state,
                //     chats: store.getState()
                // })
            })
            .catch(error => console.log(error))

        this.chatSocket.onopen = (data) => {
            // console.log("socket opened", data)
        }
        this.chatSocket.onmessage = (data) => this.chatSocketMessage(data)
        window.addEventListener("focus", this.windowEvent)
        window.addEventListener("blur", this.windowEvent)
    }

    chatSocketMessage(data) {
        if ('data' in data) {
            data = JSON.parse(data.data)
            const message = data.message;
            if (data.type === 'status') {
                this.updateLiveStatus(message);
            } else if (data.type == 'seenStatus') {
                console.log(data)
                const roomId = encodeRoomId(message.roomId);
                this.setState({
                    ...this.state,
                    chats: {
                        ...this.state.chats,
                        [roomId]: {
                            ...this.state.chats[roomId],
                            chats: this.state.chats[roomId].chats.map(chat => {
                                return {
                                    ...chat,
                                    seen: true
                                }
                            }),
                            unseenCount: 0
                        }
                    }
                })
            } else if (data.type === "message") {
                console.log(data)
                const roomId = encodeRoomId(message.roomId);
                console.log(roomId)

                this.setState({
                    ...this.state,
                    chats: {
                        ...this.state.chats,
                        [roomId]: {
                            ...this.state.chats[roomId],
                            chats: [
                                ...this.state.chats[roomId].chats,
                                message
                            ],
                            unseenCount: roomId === this.state.activePanel
                                ? this.state.chats[roomId].unseenCount : this.state.chats[roomId].unseenCount + 1
                        }
                    }
                }, () => {                
                // console.log(message.roomId === this.state.activeRoomId && message.user !== this.state.userId)
                    if(message.roomId === this.state.activeRoomId && message.user !== this.state.userId) {
                        this.updateSeen();
                    }
                });

                if(message.roomId !== this.state.activeRoomId || !isTabActive) {
                    playSound();
                }

            }
        }
    }

    clickHandeler(roomId, status) {
        var room = encodeRoomId(roomId)
        const activePanel = this.state.activePanel
        const newChatState = () => {
            // console.log("isactive", this)
            if (activePanel) {
                return {
                    [room]: {
                        ...this.state.chats[room],
                        isActive: true
                    },
                    [activePanel]: {
                        ...this.state.chats[activePanel],
                        isActive: false
                    }
                }
            }
            return {
                [room]: {
                    ...this.state.chats[room],
                    isActive: true
                }
            }
        }
        if (room != activePanel) {
            this.setState({
                ...this.state,
                activePanel: room,
                activeRoomId: roomId,
                chats: {
                    ...this.state.chats,
                    ...newChatState()
                }
            },() => {
                this.updateSeen();
            })
            // console.log(newChatState(), "New state", room, activePanel, this.state)
        }
        // console.log(room, this.state, 'namanan')
    }

    updateSeen() {
        // console.log("update seem")
        if (isTabActive) {
            // console.log("update seem ok")
            this.chatSocket.send(JSON.stringify({
                type: 'seenStatus',
                roomId: this.state.activeRoomId
            }))
        }
    }

    submitOnEnter(event) {
        if (event.keyCode === 13 && !event.shiftKey) {
            this.handleSubmit(event);
        }
    }

    handleChange(event) {
        if (this.state.activeRoomId != 0) {
            this.setState({
                ...this.state,
                textValue: event.target.value
            });
        }
    }

    handleSubmit(event) {
        if (this.state.activeRoomId !== 0 && this.state.textValue) {
            this.chatSocket.send(JSON.stringify({
                'type': 'message',
                'text': this.state.textValue,
                'roomId': this.state.activeRoomId
            }));

            this.setState({
                ...this.state,
                textValue: ""
            })
        }
        event.preventDefault();
    }

    render() {
        const header = Object.keys(this.state.chats).filter(chat =>
            this.state.chats[chat].isActive == true)
        // console.log(header, header == [])
        return (
            <div className="container clearfix">
                <div className="people-list" id="people-list">
                    <div className="search">
                        <input type="text" placeholder="search" />
                        <i className="fa fa-search" />
                    </div>
                    <SidePanel chats={this.state.chats}
                        action={(...props) => this.clickHandeler(...props)}
                    />
                </div>
                <div className="chat">
                    {<Header chat={header.length != 0 ? this.state.chats[header] : ""} updateSeen={(...props) => this.updateSeen(...props)} />}
                    <div className="chat-message clearfix">
                        <form onSubmit={this.handleSubmit}>
                            <textarea onKeyDown={this.submitOnEnter} value={this.state.textValue} onChange={this.handleChange} placeholder="Type your message" rows={2} />
                            <i className="fa fa-file-o" /> &nbsp;&nbsp;&nbsp;
                    <i className="fa fa-file-image-o" />
                            <button type="submit">Send</button>
                        </form>
                    </div>
                </div>
            </div>
        );
    }
}

ReactDOM.render(<Main />, document.getElementById('root'));