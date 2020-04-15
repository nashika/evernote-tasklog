import { Server } from "http";

import { injectable } from "inversify";

import logger from "../logger";
import TableSService from "./table-s.service";
import BaseSService from "./base.s-service";
import SocketIoSService from "./socket-io.s-service";

@injectable()
export default class MainSService extends BaseSService {
  constructor(
    protected tableService: TableSService,
    protected socketIoServerService: SocketIoSService /*
    protected syncService: SyncService,
    protected evernoteClientService: EvernoteClientService
     */
  ) {
    super();
  }

  async initialize(server: Server): Promise<void> {
    await this.socketIoServerService.initialize(server);
    await this.tableService.initialize();
    // await this.evernoteClientService.initialize();
    // const remoteUser = await this.evernoteClientService.getUser();
    // await this.tableService.optionTable.saveValueByKey("user", remoteUser);
    // await this.syncService.sync(true);
    // const attendanceRepository = this.tableService.attendanceRepository;
    // const attendances = await attendanceRepository.find();
    // console.log(attendances.length);
    /*
    const attendance = new AttendanceSEntity();
    attendance.personId = 4;
    attendance.year = 2020;
    attendance.month = 12;
    attendance.day = 31;
    attendance.arrivalTime = 600;
    attendance.departureTime = 1200;
    attendance.restTime = 60;
    attendance.remarks = "";
    let createdAttendance = await attendanceRepository.save(attendance);
     */
    logger.info(`Init user finished. data was initialized.`);
  }
}
