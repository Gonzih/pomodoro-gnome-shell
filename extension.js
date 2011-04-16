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

var Time = {
    pomodoro: 25, //min
    short_break: 5, //min
    long_break: 15, //min
    default_notice: 3 //sec
}

var Pomodoro = {
    acitve: false,
    pomodoros: 0,

    activate: function() {
        Pomodoro.active = true;
    },

    disable: function() {
        Pomodoro.active = false;
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
    Pomodoro.activate();
    _showNotice('Lets Pomodoro');
    Mainloop.timeout_add(Time.pomodoro * 60 * 1000, go_pomodoro);
};

function _stop_pomodoro() {
    Pomodoro.disable();
    Pomodoro.pomodoros = 0;
    _showNotice('Stoped');
};

function _pause_pomodoro() {
    Pomodoro.disable();
    _showNotice('Paused');
};

function _showNotice(text, delay) {
    if (!text) text = '=)';
    if (!delay) delay = Time.default_notice * 1000;
    let label = new St.Label({ style_class: 'pomodoro-label', text: text });
    let monitor = global.get_primary_monitor();

    global.stage.add_actor(label);
    label.set_position(Math.floor (monitor.width / 2 - label.width / 2),
                      Math.floor(monitor.height / 2 - label.height / 2));

    Mainloop.timeout_add(delay, function () { label.destroy(); });
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
    take_break('Go to long break (' + Time.long_break + ' min)', 'Back to work', Time.long_break);
};

function take_short_break() {
    take_break('Go to long break (' + Time.short_break + ' min)', 'Back to work', Time.short_break);
};

function take_break(start_message, stop_message, break_time) {
    _showNotice(start_message);
    Pomodoro.disable();
    Mainloop.timeout_add(break_time * 60 * 1000, function() {
        Pomodoro.activate();
        _showNotice(stop_message, 3 * 60 * 1000);
        Mainloop.timeout_add(Time.pomodoro * 60 * 1000, go_pomodoro);
    });
}

var _pomodoroButtonOnPanel;

function main(extensionMeta) {
    let userExtensionLocalePath = extensionMeta.path + '/locale';
    let _pomodoroButtonOnPanel = new _pomodoroButton();
};

// vim: set ts=4 shiftwidth=4:
