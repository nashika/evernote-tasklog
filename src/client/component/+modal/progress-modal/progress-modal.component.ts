import Component from "vue-class-component";

import BaseComponent from "../../base.component";
import {ProgressService} from "../../../service/progress.service";
import {container} from "../../../inversify.config";

@Component({})
export default class ProgressModalComponent extends BaseComponent {

  progressService: ProgressService = container.get(ProgressService);

}
