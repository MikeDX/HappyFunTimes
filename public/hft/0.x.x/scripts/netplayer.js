/*
 * Copyright 2014, Gregg Tavares.
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are
 * met:
 *
 *     * Redistributions of source code must retain the above copyright
 * notice, this list of conditions and the following disclaimer.
 *     * Redistributions in binary form must reproduce the above
 * copyright notice, this list of conditions and the following disclaimer
 * in the documentation and/or other materials provided with the
 * distribution.
 *     * Neither the name of Gregg Tavares. nor the names of its
 * contributors may be used to endorse or promote products derived from
 * this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
 * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
 * A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
 * OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
 * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
 * LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
 * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
 * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

"use strict";

define(function() {

  var emptyMsg = {};

  /**
   * Event that the player has left.
   *
   * @event NetPlayer#disconnected
   */

  /**
   * Manages a player across the net.
   *
   * **NOTE: YOU DO NOT CREATE THESE DIRECTLY**. They are created
   * by the `GameServer` whenever a new player joins your game.
   * They are passed to you in the 'playerconnect' event from
   * `GameServer`
   *
   * @private
   * @constructor
   * @alias NetPlayer
   * @param {GameServer} server
   * @param {number} id
   * @param {string} name
   */
  var NetPlayer = function(server, id) {
    this.server = server;
    this.id = id;
    this.eventHandlers = { };
    this.connected = true;
  };

  /**
   * Sends a message to this player.
   *
   * @param {string} cmd
   * @param {object?} msg a jsonifyable object.
   */
  NetPlayer.prototype.sendCmd = function(cmd, msg) {
    if (!this.connected) {
      return;
    }
    if (msg === undefined) {
      msg = emptyMsg;
    }
    this.server.sendCmd("client", this.id, {cmd: cmd, data: msg});
  };

  /**
   * Adds an event listener
   *
   * You make up these events. Calling
   *
   *     GameClient.sendCmd('someEvent', { foo: 123});
   *
   * In the controller (the phone) will emit an event `someEvent`
   * which will end up calling the handler. That handler will be
   * passed the data. In the example above that data is
   * `{foo:123}`
   *
   *     function handleSomeEvent(data) {
   *       console.log("foo = " + data.foo);
   *     }
   *
   *     someNetPlayer.addEventListener('someEvent', handleSomeEvent);
   *
   *
   * @param {string} eventType name of event.
   * @param {function(object)} handler function to call when event
   *        arrives
   */
  NetPlayer.prototype.addEventListener = function(eventType, handler) {
    var self = this;

    switch (eventType) {
      case 'disconnect':
        handler = function(handler) {
          return function() {
             self.removeAllListeners();
             self.connected = false;
             return handler.apply(this, arguments);
          };
        }(handler);
        break;
    }
    this.eventHandlers[eventType] = handler;
  };

  /**
   * Removes an event listener
   * @param {string} eventType name of event to remove
   */
  NetPlayer.prototype.removeEventListener = function(eventType) {
    this.eventHandlers[eventType] = undefined;
  };

  /**
   * Removes all listeners
   */
  NetPlayer.prototype.removeAllListeners = function() {
    this.eventHanders = { };
  };

  NetPlayer.prototype.sendEvent_ = function(eventType, args) {
    var fn = this.eventHandlers[eventType];
    if (fn) {
      fn.apply(this, args);
    } else {
      console.error("NetPlayer: Unknown Event: " + eventType);
    }
  };

  /**
   * Moves this player to another game.
   */
  NetPlayer.prototype.switchGame = function(gameId, data) {
    if (this.connected) {
      this.server.sendCmd("switchGame", this.id, {gameId: gameId, data: data});
      this.connected = false;
    }
  };

  return NetPlayer;
});

