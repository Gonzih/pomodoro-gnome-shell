/*
    Choose a task to be accomplished
    Set the Pomodoro to 25 minutes (the Pomodoro is the timer)
    Work on the task until the Pomodoro rings, then put a check on your sheet of paper
    Take a short break (5 minutes is OK)
    Every 4 Pomodoros take a longer break
*/

const St = imports.gi.St;
const Mainloop = imports.mainloop;
const Main = imports.ui.main;
const Shell = imports.gi.Shell;
const Lang = imports.lang;
const PopupMenu = imports.ui.popupMenu;
const PanelMenu = imports.ui.panelMenu;

var Messages = {
    back: 'Go back to work',
    'short': 'Take short break',
    'long': 'Take long break'
}

var Time = {
    pomodoro: 25 * 60, //sec
    short_break: 5 * 60, //sec
    long_break: 15 * 60, //sec
    after_break_notice: 5, //sec
    default_notice: 3 //sec
}
//debug
//Time = {
    //pomodoro: 25,
    //short_break: 15,
    //long_break: 20,
    //after_break_notice: 5,
    //default_notice: 5
//}

var Pomodoro = {
    pause_counter: 0,
    pause_array: [true],
    active: false,
    pomodoros: 0,
    paused: false,
    time_start: null, //time
    time_limit: null, //in mins

    activate: function() {
        this.active = true;
        if (this.paused) {
            this.paused = false;
            this.time_start = new Date();
        }
    },

    disable: function() {
        this.active = false;
        this.pause_array[this.pause_counter] = false;
        this.pause_counter += 1;
        this.pause_array[this.pause_counter] = true;
    },

    pause: function() {
        this.disable();
        this.paused = true;
        this.time_limit = this.get_time_left(); //in miliseconds
    },

    set_time_label_value: function() {
        if (!this.paused) {
            let time = this.get_time_left();
            time = new Date(time);
            let string = '';
            let delimeter = ' ';
            /*
            if (time.getHours() > 3) {
                if (time.getHours() < 10) string += 0;
                string += (time.getHours() - 3) + delimeter; //3 here becouse all Dates in untix start from 3 hour
            }
            */
            if (time.getMinutes() < 10) string += 0;
            string += time.getMinutes() + delimeter;
            if (time.getSeconds() < 10) string += 0;
            string += time.getSeconds() + delimeter;
            this.time_label.text = string;
        }
    },

    set_limit: function(limit) {
        if (limit) {
            this.time_limit = limit * 1000;
            this.time_start = new Date();
        }
    },

    get_time_left: function() { //in miliseconds
        let time = new Date - this.time_start;
        time = this.time_limit - time;
        return time;
    }
};

function _pomodoroButton() {
    this._init();
}

_pomodoroButton.prototype = {
    __proto__: PanelMenu.Button.prototype,

    _init: function() {
        PanelMenu.Button.prototype._init.call(this, 0.0);
        this._label = new St.Label({ style_class: 'panel-label', text: "Pomodoro" });
        this.actor.set_child(this._label);
        Main.panel._centerBox.add(this.actor, { y_fill: true });

        this._start = new PopupMenu.PopupMenuItem('Start');
        this._pause = new PopupMenu.PopupMenuItem('Pause');
        this._stop = new PopupMenu.PopupMenuItem('Stop');
        this.menu.addMenuItem(this._start);
        this.menu.addMenuItem(this._pause);
        this.menu.addMenuItem(this._stop);
        this._start.connect('activate', Lang.bind(this, _start_pomodoro));
        this._pause.connect('activate', Lang.bind(this, _pause_pomodoro));
        this._stop.connect('activate', Lang.bind(this, _stop_pomodoro));
    },

    _onDestroy: function() {}

};

function _start_pomodoro() {
    if (!Pomodoro.active) {
        let func;
        if (Pomodoro.paused) {
            _showNotice('Resume');
            func = back_to_work;
        } else {
            _showNotice('Lets Pomodoro');
            Pomodoro.set_limit(Time.pomodoro);
            func = go_pomodoro;
        }
        Pomodoro.activate();
        show_time();
        add_timeout(Pomodoro.time_limit / 1000, func);
    }
};

function _stop_pomodoro() {
    if (Pomodoro.active || Pomodoro.paused) {
        Pomodoro.disable();
        Pomodoro.paused = false;
        Pomodoro.pomodoros = 0;
        _showNotice('Stopped');
        hide_time();
    }
};

function _pause_pomodoro() {
    if (Pomodoro.active) {
        Pomodoro.pause();
        _showNotice('Paused');
    }
};

function _showNotice(text, delay) {
    if (!text) text = '=)';
    if (!delay) delay = Time.default_notice;
    if (!Pomodoro.notice_label) {
    Pomodoro.notice_label = new St.Label({ style_class: 'pomodoro-label', text: text });
    global.stage.add_actor(Pomodoro.notice_label);
    } else {
        Pomodoro.notice_label.text = text;
    }

    let monitor = global.get_primary_monitor();
    Pomodoro.notice_label.set_position(Math.floor (monitor.width / 2 - Pomodoro.notice_label.width / 2),
                      Math.floor(monitor.height / 2 - Pomodoro.notice_label.height / 2));

    add_timeout(delay, function () {
        Pomodoro.notice_label.destroy();
        delete Pomodoro.notice_label;
    });
};

function go_pomodoro() {
    if (Pomodoro.active) {
        Pomodoro.pomodoros += 1;
        if (Pomodoro.pomodoros === 4) {
            take_long_break();
        } else {
            take_short_break();
        }
    }
};

function take_long_break() {
    Pomodoro.pomodoros = 0;
    take_break(Messages['long'], Time.long_break);
};

function take_short_break() {
    take_break(Messages['short'], Time.short_break);
};

function take_break(start_message, break_time) {
    _showNotice(start_message + ' (' + break_time / 60 + ' min)', break_time);
    Pomodoro.set_limit(break_time);
    add_timeout(break_time, function() { back_to_work() } );
}

function back_to_work() {
        Pomodoro.activate();
        _showNotice(Messages.back, Time.after_break_notice);
        Pomodoro.set_limit(Time.pomodoro);
        add_timeout(Time.pomodoro, go_pomodoro);
}

function show_time() {
    if ((!Pomodoro.paused) && Pomodoro.active) {
        if (!Pomodoro.time_label) {
            Pomodoro.time_label = new St.Label({ style_class: 'pomodoro-time-label', text: '' });
            global.stage.add_actor(Pomodoro.time_label);
        }

        Pomodoro.set_time_label_value();
        let monitor = global.get_primary_monitor();
        Pomodoro.time_label.set_position(Math.floor(monitor.width - Pomodoro.time_label.width),
                                         Math.floor(monitor.height - Pomodoro.time_label.height));
        add_timeout(1, show_time);
    }
}

function hide_time() {
    Pomodoro.time_label.destroy();
    delete Pomodoro.time_label;
}

function add_timeout(time, func) {
    let (number = Pomodoro.pause_counter) {
        Mainloop.timeout_add_seconds(time, function() {
            if (Pomodoro.pause_array[number] === true) { func(); }
        });
    }
}

var Log_label;

function log(text) {
    text = text.toString();
    if (Log_label) {
        Log_label.text += "\n" + text;
    } else {
        Log_label = new St.Label({ style_class: 'pomodoro-log-label', text: text });
        global.stage.add_actor(Log_label);
        Log_label.set_position(5, 30);
    }
}

function main(extensionMeta) {
    let _pomodoroButtonOnPanel = new _pomodoroButton();
}

// vim: set ts=4 shiftwidth=4:
