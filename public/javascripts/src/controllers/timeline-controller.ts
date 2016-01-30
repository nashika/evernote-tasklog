import * as async from 'async';

import {DataStoreService} from "../services/data-store";
import {DataTranscieverService} from "../services/data-transciever";
import {NoteEntity} from "../../../../lib/models/entities/note-entity";
import {TimeLogEntity} from "../../../../lib/models/entities/time-log-entity";

declare var vis:any;

interface ITimelineControllerScope extends angular.IScope {
    dataStore:DataStoreService;
    timelineItems:any;
    timelineGroups:any;
    start:moment.Moment;
    end:moment.Moment;
}

interface TimelineItem {
    id:string,
    group:string,
    content:string,
    start:Date,
    end?:Date,
    type:string,
}

class TimelineController {

    constructor(protected $scope:ITimelineControllerScope,
                protected $filter:angular.IFilterService,
                protected $http:angular.IHttpService,
                protected dataStore:DataStoreService,
                protected dataTransciever:DataTranscieverService) {
        this.$scope.dataStore = this.dataStore;
        this.$scope.timelineItems = new vis.DataSet();
        this.$scope.timelineGroups = new vis.DataSet();
        this.$scope.start = moment().startOf('day');
        this.$scope.end = moment().endOf('day');
        this.dataTransciever.reload({start: this.$scope.start, end: this.$scope.end}, () => {
            var container = document.getElementById('timeline');
            // set working time
            var hiddenDates:Array<{start:moment.Moment, end:moment.Moment, repeat:string}>;
            if (this.dataStore.settings && this.dataStore.settings['startWorkingTime'] && this.dataStore.settings['endWorkingTime'])
                hiddenDates = [{
                    start: moment().subtract(1, 'days').startOf('day').hour(this.dataStore.settings['endWorkingTime']),
                    end: moment().startOf('day').hour(this.dataStore.settings['startWorkingTime']),
                    repeat: 'daily',
                }];
            else
                hiddenDates = [];
            // generate timeline object
            this.$scope['timeline'] = new vis.Timeline(container, this.$scope.timelineItems, this.$scope.timelineGroups, {
                margin: {item: 5},
                height: window.innerHeight - 80,
                orientation: {axis: 'both', item: 'top'},
                start: this.$scope.start,
                end: this.$scope.end,
                order:(a:TimelineItem, b:TimelineItem) => {
                    return a.start.getTime() - b.start.getTime();
                },
                hiddenDates: hiddenDates,
            });
            // set person data
            if (!this.dataStore.settings || !this.dataStore.settings['persons']) return;
            for (var person of this.dataStore.settings['persons'])
                this.$scope.timelineGroups.add({
                    id: person.name,
                    content: person.name,
                });
            this.$scope.timelineGroups.add({
                id: 'updated',
                content: 'Update',
            });
            // add events
            this.$scope['timeline'].on('rangechanged', this._onRangeChanged);
            this.$scope.$on('resize::resize', this._onResize);
            this.$scope.$on('event::reload', this._onReload);
            // reload
            this._onReloadEnd();
        });
    }

    protected _onRangeChanged = (properties:{start:Date, end:Date}):void => {
        var currentStart = moment(properties.start).startOf('day');
        var currentEnd = moment(properties.end).endOf('day');
        if (currentStart.isSameOrAfter(this.$scope.start) && currentEnd.isSameOrBefore(this.$scope.end))
            return;
        if (!this.$scope.start || currentStart.isBefore(this.$scope.start)) this.$scope.start = currentStart;
        if (!this.$scope.end || currentEnd.isAfter(this.$scope.end)) this.$scope.end = currentEnd;
        this._onReload();
    };

    protected _onReload = ():void => {
        this.dataTransciever.reload({start: this.$scope.start, end: this.$scope.end}, this._onReloadEnd);
    }

    protected _onReloadEnd = ():void => {
        this.$scope.timelineItems.clear();
        var notes:{[noteGuid:string]:NoteEntity} = {};
        for (var noteGuid in this.dataStore.notes) {
            var note:NoteEntity = this.dataStore.notes[noteGuid];
            notes[note.guid] = note;
            var timelineItem:TimelineItem = {
                id: note.guid,
                group: 'updated',
                content: `<a href="evernote:///view/${this.dataStore.user.id}/${this.dataStore.user.shardId}/${note.guid}/${note.guid}/" title="${note.title}">${(<any>this.$filter('abbreviate'))(note.title, 40)}</a>`,
                start: moment(note.updated).toDate(),
                type: 'point',
            }
            this.$scope.timelineItems.add(timelineItem);
        }
        for (var noteGuid in this.dataStore.timeLogs) {
            var noteTimeLogs = this.dataStore.timeLogs[noteGuid];
            for (var timeLogId in noteTimeLogs) {
                var timeLog:TimeLogEntity = noteTimeLogs[timeLogId];
                var noteTitle:string = notes[timeLog.noteGuid].title;
                var timelineItem:TimelineItem = {
                    id: timeLog._id,
                    group: timeLog.person,
                    content: `<a href="evernote:///view/${this.dataStore.user['id']}/${this.dataStore.user['shardId']}/${timeLog.noteGuid}/${timeLog.noteGuid}/" title="${noteTitle} ${timeLog.comment}">${(<any>this.$filter('abbreviate'))(noteTitle, 20)} ${(<any>this.$filter('abbreviate'))(timeLog.comment, 20)}</a>`,
                    start: moment(timeLog.date).toDate(),
                    end: timeLog.spentTime ? moment(timeLog.date).add(timeLog.spentTime, 'minutes').toDate() : null,
                    type: timeLog.spentTime ? 'range' : 'point',
                }
                this.$scope.timelineItems.add(timelineItem);
            }
        }
    };

    protected _onResize = ():void => {
        this.$scope['timeline'].setOptions({
            height: window.innerHeight - 90,
        });
    }

}

angular.module('App').controller('TimelineController', ['$scope', '$filter', '$http', 'dataStore', 'dataTransciever', TimelineController]);
