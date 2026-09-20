// Simulation/reporting JCS metadata. These are conventions, not a clinical diagnostic model.
// Axes refer to anatomical frame (+X anterior, +Y superior, +Z subject-right).
export const JOINT_COORDINATE_SYSTEMS={
  pelvis:{dof:['tilt','list','axialRotation'],axes:{tilt:'Z',list:'X',axialRotation:'Y'}},
  lumbar:{dof:['flexionExtension','lateralBend','axialRotation'],axes:{flexionExtension:'Z',lateralBend:'X',axialRotation:'Y'}},
  thoracic:{dof:['flexionExtension','lateralBend','axialRotation'],axes:{flexionExtension:'Z',lateralBend:'X',axialRotation:'Y'}},
  cervical:{dof:['flexionExtension','lateralBend','axialRotation'],axes:{flexionExtension:'Z',lateralBend:'X',axialRotation:'Y'}},
  sternoclavicular:{dof:['elevation','protraction','axialRotation']},
  acromioclavicular:{dof:['upwardRotation','internalRotation','posteriorTilt']},
  glenohumeral:{dof:['planeOfElevation','elevation','axialRotation']},
  elbow:{dof:['flexionExtension']},
  radioulnar:{dof:['pronationSupination']},
  wrist:{dof:['flexionExtension','radialUlnarDeviation']},
  hip:{dof:['flexionExtension','adductionAbduction','internalExternalRotation']},
  knee:{dof:['flexionExtension','adductionAbduction','internalExternalRotation'],primary:'flexionExtension'},
  ankle:{dof:['dorsiPlantarFlexion','inversionEversion','axialRotation'],primary:'dorsiPlantarFlexion'},
  subtalar:{dof:['inversionEversion'],primary:'inversionEversion'},
  mtp:{dof:['flexionExtension'],primary:'flexionExtension'}
};

export const DEFAULT_PROFESSIONAL_LIMITS={
  lumbar:{flexionExtension:[-35,55],lateralBend:[-30,30],axialRotation:[-35,35]},
  cervical:{flexionExtension:[-55,60],lateralBend:[-45,45],axialRotation:[-80,80]},
  glenohumeral:{elevation:[-10,180],axialRotation:[-95,95]},
  elbow:{flexionExtension:[0,150]},radioulnar:{pronationSupination:[-85,85]},
  wrist:{flexionExtension:[-80,80],radialUlnarDeviation:[-35,25]},
  hip:{flexionExtension:[-30,125],adductionAbduction:[-45,45],internalExternalRotation:[-50,50]},
  knee:{flexionExtension:[0,145],internalExternalRotation:[-30,30]},
  ankle:{dorsiPlantarFlexion:[-50,30]},subtalar:{inversionEversion:[-30,20]},mtp:{flexionExtension:[-30,70]}
};
