<a name="COA"></a>

## COA
**Kind**: global class  

* [COA](#COA)
    * [new COA(host, port, username, password)](#new_COA_new)
    * [.client](#COA+client)
    * [.subscribe(db, callback)](#COA+subscribe) ⇒ <code>number</code>
    * [.unsubscribe([db], [id])](#COA+unsubscribe) ⇒ <code>undefined</code>

<a name="new_COA_new"></a>

### new COA(host, port, username, password)
An interface to the COA JSON-DB server


| Param | Type | Description |
| --- | --- | --- |
| host | <code>string</code> | The COA JSON-DB server address |
| port | <code>number</code> | The COA JSON-DB server port |
| username | <code>string</code> | Your system's COA username |
| password | <code>string</code> | Your system's COA password |

<a name="COA+client"></a>

### coA.client
**Kind**: instance property of [<code>COA</code>](#COA)  
**Properties**

| Type |
| --- |
| <code>JSONClient</code> | 

<a name="COA+subscribe"></a>

### coA.subscribe(db, callback) ⇒ <code>number</code>
Subscribe to updates

**Kind**: instance method of [<code>COA</code>](#COA)  
**Returns**: <code>number</code> - The callback ID, for use with coa.unsubscribe  

| Param | Type | Description |
| --- | --- | --- |
| db | <code>string</code> | The JSON-DB module to subscribe to (eg. 'presence') |
| callback | <code>function</code> | A function that accepts a JSON-DB update object as its sole parameter |

<a name="COA+unsubscribe"></a>

### coA.unsubscribe([db], [id]) ⇒ <code>undefined</code>
Unsubscribe from updates

**Kind**: instance method of [<code>COA</code>](#COA)  

| Param | Type | Description |
| --- | --- | --- |
| [db] | <code>string</code> | The JSON-DB module to unsubscribe from (eg. 'presence') (undefined means all) |
| [id] | <code>number</code> | The callback to remove (undefined means all) |

<a name="Presence"></a>

## Presence
**Kind**: global class  

* [Presence](#Presence)
    * [new Presence(coa)](#new_Presence_new)
    * [.read([system], [node])](#Presence+read) ⇒ <code>object</code> \| <code>null</code>
    * [.write()](#Presence+write) ⇒ <code>undefined</code>
    * [.subscribe(callback)](#Presence+subscribe) ⇒ <code>number</code>
    * [.unsubscribe([id])](#Presence+unsubscribe) ⇒ <code>undefined</code>

<a name="new_Presence_new"></a>

### new Presence(coa)
An interface to the COA Presence database


| Param | Type | Description |
| --- | --- | --- |
| coa | <code>COA</code> | An instance of the COA object (client/lib/coa.js) |

<a name="Presence+read"></a>

### presence.read([system], [node]) ⇒ <code>object</code> \| <code>null</code>
Read presence data for all systems, one system, or one node on one system

**Kind**: instance method of [<code>Presence</code>](#Presence)  
**Returns**: <code>object</code> \| <code>null</code> - The requested presence data, or null if unavailable  

| Param | Type | Description |
| --- | --- | --- |
| [system] | <code>string</code> | A particular system (optional) |
| [node] | <code>number</code> | A node of [system] (optional) |

<a name="Presence+write"></a>

### presence.write() ⇒ <code>undefined</code>
Write any new / changed presence data to the server

**Kind**: instance method of [<code>Presence</code>](#Presence)  
<a name="Presence+subscribe"></a>

### presence.subscribe(callback) ⇒ <code>number</code>
Subscribe to updates from all systems

**Kind**: instance method of [<code>Presence</code>](#Presence)  
**Returns**: <code>number</code> - Subscription ID, for use with presence.unsubscribe  

| Param | Type | Description |
| --- | --- | --- |
| callback | <code>function</code> | Receives an object containing everything that changed in this update.<br> |

<a name="Presence+unsubscribe"></a>

### presence.unsubscribe([id]) ⇒ <code>undefined</code>
Unsubscribe from updates<br>
If no [id] given, unsubscribes from all updates<br>

**Kind**: instance method of [<code>Presence</code>](#Presence)  

| Param | Type | Description |
| --- | --- | --- |
| [id] | <code>number</code> | ID of the subscription to remove (from presence.subscribe) |

